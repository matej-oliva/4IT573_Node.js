import test from "ava";
import supertest from "supertest";
import { app } from "../src/app.js";
import { db } from "../src/database.js";

test.beforeEach(async () => {
	await db.migrate.latest();
});

test.afterEach.always(async () => {
	await db.migrate.rollback();
});

test.serial("modify todo from detail page", async (t) => {
	const oldTitle = "Old title of todo";
	const newTitle = "New title of todo";
	const todoId = 1;

	await supertest(app)
		.post("/new-todo")
		.type("form")
		.send({ title: oldTitle });

	const doesTodoExist = await supertest(app).get(`/todo/${todoId}`);
	t.assert(doesTodoExist.text.includes(oldTitle));

	await supertest(app)
		.post(`/todo/${todoId}`)
		.type("form")
		.send({ title: newTitle })
		.redirects(1);

	const updatedTodoResponse = await supertest(app).get(`/todo/${todoId}`);
	t.assert(updatedTodoResponse.text.includes(newTitle));
});

test.serial("toggle done from list", async (t) => {
	const todoId = 1;

	await supertest(app)
		.post("/new-todo")
		.type("form")
		.send({ title: "Some Todo title" });

	const listBeforeToggle = await supertest(app).get("/");
	t.assert(listBeforeToggle.text.includes("Not Done"));

	await supertest(app)
		.get(`/change-todo-state/${todoId}`)
		.set("Referer", "/")
		.redirects(1);

	const listAfterToggle = await supertest(app).get(`/`);

	t.assert(!listAfterToggle.text.includes("Not Done"));
});

test.serial("toggle done from detail", async (t) => {
	const todoId = 1;

	await supertest(app)
		.post("/new-todo")
		.type("form")
		.send({ title: "Some Todo title" });

	const detailBeforeToggle = await supertest(app).get("/todo/1");
	t.assert(detailBeforeToggle.text.includes("Mark as Done"));

	await supertest(app)
		.get(`/change-todo-state/${todoId}`)
		.set("Referer", "/")
		.redirects(1);

	const detailAfterToggle = await supertest(app).get(`/todo/1`);

	t.assert(detailAfterToggle.text.includes("Mark as Not Done"));
});

test.serial(
	"display error message when adding todo without title",
	async (t) => {
		const response = await supertest(app)
			.post("/new-todo")
			.type("form")
			.send({ title: "" });

		t.assert(response.text.includes("Insert a todo title!"));
	}
);
