import express from "express";
import { db } from "./database.js";
import {
  sendTodoDeleteToAllConnections,
  sendTodoDoneStateToAllConnections,
  sendTodosToAllConnections,
} from "./websockets.js";
import bcrypt from "bcrypt";
import session from "express-session";

export const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "The Ring Must Be Destroyed In The Fires Of Mount Doom",
    resave: false,
    saveUninitialized: false,
  })
);

app.get("/", async (req, res) => {
  try {
    if (!req.session.user) {
      res.render("index", {
        todos: [],
        query: req.query,
        user: req.session.user,
        isLoggedIn: false,
      });
      return;
    }

    let todos = db("todos");

    if (req.session.user.id) {
      todos = todos.where("user_id", req.session.user.id);
    }

    const { done, priority, due_date_from, due_date_to, search } = req.query;

    if (done !== undefined && done !== "all") {
      todos = todos.where("done", done === "true");
    }
    if (priority) {
      todos = todos.where("priority", priority);
    }
    if (due_date_from && due_date_to) {
      todos = todos.whereBetween("due_date", [due_date_from, due_date_to]);
    }
    if (search) {
      todos = todos.where("title", "like", `%${search}%`);
    }

    const filteredTodos = await todos;

    res.render("index", {
      todos: filteredTodos,
      query: req.query,
      user: req.session.user,
      isLoggedIn: !!req.session.user,
    });
  } catch (error) {
    console.error(error);
    res.render("index", {
      query: req.query,
      user: req.session.user,
      errorMessage: "Internal Server Error",
      todos: [],
      isLoggedIn: false,
    });
  }
});

app.post("/new-todo", async (req, res) => {
  try {
    if (!req.session.user) {
      const todos = await db("todos");
      res.render("index", {
        todos,
        query: req.query || {},
        errorMessage: "Sign in, please!",
      });
      return;
    }

    const { title, description, priority, due_date } = req.body;

    if (!title) {
      const todos = await db("todos");
      res.render("index", {
        todos,
        query: req.query,
        user: req.session.user,
        errorMessage: "Insert a todo title!",
      });
      return;
    }

    await db("todos").insert({
      title: title,
      description: description,
      done: false,
      priority: priority,
      due_date: due_date,
      user_id: req.session.user.id,
    });

    sendTodosToAllConnections();
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.render("index", {
      query: req.query,
      user: req.session.user,
      errorMessage: "Internal Server Error",
      todos: [],
      isLoggedIn: false,
    });
  }
});

app.get("/todo/:id", async (req, res) => {
  const id = Number(req.params.id);
  const isLoggedIn = !!req.session.user;

  try {
    const todo = await db("todos").where("id", id).first();
    if (!todo || todo.user_id !== req.session.user.id) {
      res.redirect("/");
      return;
    }
    res.render("detail", { todo });
  } catch (error) {
    console.error(error);
    res.render("index", {
      query: req.query,
      user: req.session.user,
      errorMessage:
        "You are trying to access a todo that does not exist or belongs to someone else!",
      todos: [],
      isLoggedIn,
    });
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
    res.render("index", {
      query: req.query,
      user: req.session.user,
      errorMessage: "Internal Server Error",
      todos: [],
      isLoggedIn: false,
    });
  }
});

app.post("/todo/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { title, description, priority, due_date } = req.body;

  try {
    await db("todos")
      .where("id", id)
      .update({
        title: title,
        description: description,
        priority: priority,
        due_date: due_date,
      });

    sendTodosToAllConnections();
    res.redirect(`/todo/${id}`);
  } catch (error) {
    console.error(error);
    res.render("index", {
      query: req.query,
      user: req.session.user,
      errorMessage: "Internal Server Error",
      todos: [],
      isLoggedIn: false,
    });
  }
});

app.get("/change-todo-state/:id", async (req, res) => {
  const idToToggle = Number(req.params.id);

  try {
    const todo = await db("todos").where("id", idToToggle).first();

    if (!todo) {
      const isLoggedIn = !!req.session.user;
      const todos = isLoggedIn
        ? await db("todos").where("user_id", req.session.user.id)
        : [];

      res.render("index", {
        query: req.query,
        user: req.session.user,
        errorMessage: "Todo not found",
        todos,
        isLoggedIn,
      });
      return;
    }

    await db("todos").where("id", idToToggle).update({
      done: !todo.done,
    });

    sendTodosToAllConnections();
    sendTodoDoneStateToAllConnections(idToToggle, !todo.done);

    res.redirect("back");
  } catch (error) {
    console.error(error);
    res.render("index", {
      query: req.query,
      user: req.session.user,
      errorMessage: "Internal Server Error",
      todos: [],
      isLoggedIn: false,
    });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.render("index", {
        query: req.query,
        user: req.session.user,
        errorMessage: "Please provide username and password",
        todos: [],
        isLoggedIn: false,
      });
      return;
    }
    const existingUser = await db("users")
      .where("username", username)
      .first();
    if (existingUser) {
      res.render("index", {
        query: req.query,
        user: req.session.user,
        errorMessage: "Username already exists",
        todos: [],
        isLoggedIn: false,
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db("users").insert({
      username: username,
      password: hashedPassword,
    });

    req.session.user = await db("users").where("username", username).first();

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.render("index", {
      query: req.query,
      user: req.session.user,
      errorMessage: "Internal server error",
      todos: [],
      isLoggedIn: false,
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.render("index", {
        query: req.query,
        user: req.session.user,
        errorMessage: "Please provide a username and password",
        todos: [],
        isLoggedIn: false,
      });
      return;
    }

    const user = await db("users").where("username", username).first();
    if (!user) {
      res.render("index", {
        query: req.query,
        user: req.session.user,
        errorMessage: "Invalid username or password",
        todos: [],
        isLoggedIn: false,
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.render("index", {
        query: req.query,
        user: req.session.user,
        errorMessage: "Invalid username or password",
        todos: [],
        isLoggedIn: false,
      });
      return;
    }

    req.session.user = user;

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.render("index", {
      query: req.query,
      user: req.session.user,
      errorMessage: "Internal Server Error",
      todos: [],
      isLoggedIn: false,
    });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.use((req, res) => {
  res.status(404).render("404");
});
