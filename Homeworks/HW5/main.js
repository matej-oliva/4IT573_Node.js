import express from "express";
import { db } from "./src/database.js";
import {
	createWebSocketServer,
	sendTodoDeleteToAllConnections,
	sendTodoDoneStateToAllConnections,
	sendTodosToAllConnections,
} from "./src/websockets.js";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", async (req, res) => {
	try {
		const { done, priority, due_date_from, due_date_to, search } =
			req.query;
		let todos = db("todos");

		if (done) {
			todos = todos.where("done", done === "true");
		}
		if (priority) {
			todos = todos.where("priority", priority);
		}
		if (due_date_from && due_date_to) {
			todos = todos.whereBetween("due_date", [
				due_date_from,
				due_date_to,
			]);
		}
		if (search) {
			todos = todos.where("title", "like", `%${search}%`);
		}

		const filteredTodos = await todos;
		res.render("index", { todos: filteredTodos, query: req.query });
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal Server Error");
	}
});

app.post("/new-todo", async (req, res) => {
	try {
		await db("todos").insert({
			title: req.body.title,
			description: req.body.description,
			done: false,
			priority: req.body.priority,
			due_date: req.body.due_date,
		});
		sendTodosToAllConnections();
		res.redirect("/");
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal Server Error");
	}
});

app.get("/todo/:id", async (req, res) => {
	const id = Number(req.params.id);

	try {
		const todo = await db("todos").where("id", id).first();
		if (!todo) {
			sendTodoDeleteToAllConnections(id);
			res.redirect("/");
			return;
		}
		res.render("detail", { todo });
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal Server Error");
	}
});

app.get("/remove-todo/:id", async (req, res) => {
	const idToRemove = Number(req.params.id);

	try {
		await db("todos").where("id", idToRemove).del();

		sendTodosToAllConnections();
		sendTodoDeleteToAllConnections(idToRemove);

		res.redirect("/");
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal Server Error");
	}
});

app.post("/todo/:id", async (req, res) => {
	const id = Number(req.params.id);
	const { title, description, priority, due_date } = req.body;

	try {
		await db("todos").where("id", id).update({
			title: title,
			description: description,
			priority: priority,
			due_date: due_date,
		});

		sendTodosToAllConnections();
		res.redirect(`/todo/${id}`);
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal Server Error");
	}
});

app.get("/change-todo-state/:id", async (req, res) => {
  const idToChange = Number(req.params.id);

  try {
    const todo = await db("todos").where("id", idToChange).first();
    if (todo) {
      const updatedDoneState = !todo.done;

      await db("todos")
        .where("id", idToChange)
        .update({ done: updatedDoneState });

      sendTodosToAllConnections();
      sendTodoDoneStateToAllConnections(idToChange, updatedDoneState);
      res.redirect(`back`);
    } else {
      res.status(404).send("Todo not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.use((req, res) => {
	res.status(404).render("404");
});

const server = app.listen(3000, () => {
	console.log("App listening on port 3000");
});

createWebSocketServer(
	server,
	sendTodosToAllConnections,
	sendTodoDeleteToAllConnections
);
