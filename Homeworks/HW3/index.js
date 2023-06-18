import express from "express";

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true}));

let todos = [
  {
    id: 0,
    title: 'Nakoupit jidlo',
    description: '5x chleba',
    done: false
  },
  {
    id: 1,
    title: 'Vyhodit ho do kose',
    description: 'Vedle v ulici',
    done: false
  },
];

app.get('/', (req, res) => {
  res.render('index', {
    name: 'Matej',
    todos: todos
  });
});

app.post('/new-todo', (req, res) => {
  const newTodo = {
    id: todos.length,
    title: req.body.title,
    description: req.body.description,
    done: false,
  };

  todos.push(newTodo);

  res.redirect('/');
});


app.get('/todo/:id', (req, res) => {
  const id = Number(req.params.id);
  const todo = todos.find((todo) => todo.id === id);

  if (!todo) {
    res.status(404).send('Todo not found');
    return;
  }

  res.render('detail', { todo });
});



app.get('/remove-todo/:id', (req, res) => {
  const idToRemove = Number(req.params.id);

  todos = todos.filter((todo) => todo.id !== idToRemove);

  res.redirect('/');
});

app.post('/edit-todo/:id', (req, res) => {
  const id = Number(req.params.id);
  const newTitle = req.body.title;
  const newDescription = req.body.description;

  todos.forEach((todo) => {
    if (todo.id === id) {
      todo.title = newTitle;
      todo.description = newDescription;
    }
  });

  res.redirect('/todo/' + id);
});


app.get('/change-todo-state/:id', (req, res) => {
  const idToChange = Number(req.params.id);

  const todo = todos.find((todo) => todo.id === idToChange);
  if (todo) {
    todo.done = !todo.done;
  }

  res.redirect('/');
});


app.get('/todos', (req, res) => {
  res.send('Seznam todoček');
});

app.listen(3000, () => {
  console.log(`App listening on port 3000`);
});
