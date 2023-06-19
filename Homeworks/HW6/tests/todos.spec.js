import test from 'ava';
import supertest from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/database.js';

test.beforeEach(async () => {
  await db.migrate.latest();
});

test.afterEach(async () => {
  await db.migrate.rollback();
});

test.serial('GET / renders the index page with filtered todos', async (t) => {
  const response = await supertest(app).get('/');

  t.is(response.status, 200);
  t.assert(response.text.includes('Todo list'));
});

test.serial('POST /new-todo creates a new todo and redirects to index', async (t) => {
  const newTodo = {
    title: 'New Todo',
    description: 'New Todo Description',
    priority: 'High',
    due_date: '2022-01-01',
  };  

  const response = await supertest(app).post('/new-todo').send(newTodo);

  t.is(response.status, 302);
  t.is(response.header['location'], '/');
});

test.serial('GET /todo/:id renders the detail page for a valid todo', async (t) => {
  const todo = {
    title: 'Test Todo',
    description: 'Test Description',
    done: false,
    priority: 'High',
    due_date: '2022-01-01',
  };

  const insertedTodo = await db('todos').insert(todo);
  const todoId = insertedTodo[0];

  const response = await supertest(app).get(`/todo/${todoId}`);

  t.is(response.status, 200);
  t.assert(response.text.includes('Test Todo'));
});

test.serial('GET /remove-todo/:id deletes a todo and redirects to index', async (t) => {
  const todo = {
    title: 'Test Todo',
    description: 'Test Description',
    done: false,
    priority: 'High',
    due_date: '2022-01-01',
  };

  const insertedTodo = await db('todos').insert(todo);
  const todoId = insertedTodo[0];

  const response = await supertest(app).get(`/remove-todo/${todoId}`);

  t.is(response.status, 302);
  t.is(response.header['location'], '/');
});

test.serial('POST /todo/:id updates a todo and redirects to detail page', async (t) => {
  const todo = {
    title: 'Test Todo',
    description: 'Test Description',
    done: false,
    priority: 'High',
    due_date: '2022-01-01',
  };

  const insertedTodo = await db('todos').insert(todo);
  const todoId = insertedTodo[0];

  const updatedTodo = {
    title: 'Updated Todo',
    description: 'Updated Description',
    priority: 'Low',
    due_date: '2022-02-02',
  };  

  const response = await supertest(app).post(`/todo/${todoId}`).send(updatedTodo);

  t.is(response.status, 302);
  t.is(response.header['location'], `/todo/${todoId}`);
});

test.serial('GET /change-todo-state/:id updates todo done state and redirects back', async (t) => {
  const todo = {
    title: 'Test Todo',
    description: 'Test Description',
    done: false,
    priority: 'High',
    due_date: '2022-01-01',
  };

  const insertedTodo = await db('todos').insert(todo);
  const todoId = insertedTodo[0];

  const response = await supertest(app).get(`/change-todo-state/${todoId}`);

  t.is(response.status, 302);
  t.is(response.header['location'], '/');
});

test.serial('GET /change-todo-state/:id returns 404 for a non-existing todo', async (t) => {
  const nonExistingTodoId = 9999;

  const response = await supertest(app).get(`/change-todo-state/${nonExistingTodoId}`);

  t.is(response.status, 404);
  t.assert(response.text.includes('Todo not found'));
});
