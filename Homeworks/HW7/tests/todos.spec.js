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
	const agent = supertest.agent(app);
	const title = "Old title of todo";
	const newTitle = "New title of todo";
	const todoId = 1;

	const username = "existinguser";
	const password = "testpassword";

	await agent
		.post("/register")
		.type("form")
		.send({ username, password })
		.redirects(1);

	await agent
		.post("/login")
		.type("form")
		.send({ username, password })
		.redirects(1);

	await agent.post("/new-todo").type("form").send({ title }).redirects(1);

	const doesTodoExist = await agent.get(`/todo/${todoId}`);
	t.assert(doesTodoExist.text.includes(title));

	await agent
		.post(`/todo/${todoId}`)
		.type("form")
		.send({ title: newTitle })
		.redirects(1);

	const updatedTodoResponse = await agent.get(`/todo/${todoId}`);
	t.assert(updatedTodoResponse.text.includes(newTitle));
});

test.serial("toggle done from list", async (t) => {
	const agent = supertest.agent(app);
	const todoId = 1;
	const username = "existinguser";
	const password = "testpassword";
	const title = "Some Todo title";

	await agent.post("/register").type("form").send({ username, password });

	await agent
		.post("/login")
		.type("form")
		.send({ username, password })
		.redirects(1);

	const listBeforeToggle = await agent.post("/new-todo").type("form").send({ title }).redirects(1);

	t.assert(listBeforeToggle.text.includes(title), "Todo should be listed");

	await agent.get(`/change-todo-state/${todoId}`).set("Referer", "/");

	const listAfterToggle = await agent.get("/");

	t.assert(
		listAfterToggle.text.includes("Some Todo title"),
		"Todo should be marked as done"
	);
});

test.serial("toggle done from detail", async (t) => {
	const agent = supertest.agent(app);
	const todoId = 1;
	const username = "existinguser";
	const password = "testpassword";
	const title = "Some Todo title";

	await agent.post("/register").type("form").send({ username, password });

	await agent
		.post("/login")
		.type("form")
		.send({ username, password })
		.redirects(1);

	await agent.post("/new-todo").type("form").send({ title }).redirects(1);

	const detailBeforeToggle = await agent.get(`/todo/${todoId}`).redirects(1);
	t.assert(
		detailBeforeToggle.text.includes("Mark as Done"),
		"Todo should be marked as not done => button should say 'Mark as Done'"
	);

	await agent
		.get(`/change-todo-state/${todoId}`)
		.set("Referer", `/todo/${todoId}`);

	const detailAfterToggle = await agent.get(`/todo/${todoId}`);

	t.assert(
		detailAfterToggle.text.includes("Mark as Not Done"),
		"Todo should be marked as done"
	);
});

test.serial(
	"display error message when adding todo without title",
	async (t) => {
		const username = "existinguser";
		const password = "testpassword";
		const agent = supertest.agent(app);
		await agent
			.post("/register")
			.type("form")
			.send({ username: "username", password: "password" });

		await agent
			.post("/login")
			.type("form")
			.send({ username, password })
			.redirects(1);

		const response = await agent.post("/new-todo").send({ title: "" });

		t.assert(response.text.includes("Insert a todo title!"));
	}
);

test.serial("register new user", async (t) => {
	const agent = supertest.agent(app);

	const username = "existinguser";
	const password = "existingpassword";
	await agent.post("/register").type("form").send({ username, password });
	await agent.post("/login").type("form").send({ username, password });

	const homepage = await agent.get("/");

	t.assert(homepage.text.includes("Welcome"));
});

test.serial("login with existing user", async (t) => {
	const agent = supertest.agent(app);

	const username = "existinguser";
	const password = "existingpassword";
	await agent
		.post("/register")
		.type("form")
		.send({ username, password })
		.redirects(1);
	const response = await agent
		.post("/login")
		.type("form")
		.send({ username, password })
		.redirects(1);
	t.assert(response.text.includes("Welcome"));
});

test.serial(
	"display error message when registering with existing username",
	async (t) => {
		const agent = supertest.agent(app);
		const username = "existinguser";
		const password = "testpassword";
		await agent
			.post("/register")
			.type("form")
			.send({ username, password })
			.redirects(1);

		const response = await agent
			.post("/register")
			.type("form")
			.send({ username, password });

		t.assert(response.text.includes("Username already exists"));
	}
);

test.serial(
	"display error message when logging in with invalid credentials",
	async (t) => {
		const agent = supertest.agent(app);
		const response = await agent
			.post("/login")
			.type("form")
			.send({ username: "nonexistinguser", password: "testpassword" })
			.redirects(1);

		t.assert(
			response.text.includes("Invalid username or password"),
			"Invalid credentials error message should be displayed"
		);
	}
);
