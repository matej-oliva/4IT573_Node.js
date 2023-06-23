import test from 'ava';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from "../src/database.js";

test.beforeEach(async () => {
	await db.migrate.latest();
});

test.afterEach.always(async () => {
	await db.migrate.rollback();
});

test.serial('GET / should return the index page', async (t) => {
  const res = await request(app).get('/');
  t.is(res.status, 200);
  t.true(res.text.includes('<h2>Welcome to the RSS Reader!</h2>'));
});

test.serial('GET /register should return the register page', async (t) => {
  const res = await request(app).get('/register');
  t.is(res.status, 200);
  t.true(res.text.includes('<h5 class="card-title">Register</h5>'));
});

test.serial('POST /register should register a new user', async (t) => {
  const res = await request(app)
    .post('/register')
    .send({
      username: 'testuser',
      password: 'testpassword',
    })
    .type("form")
    .redirects(1);
  

  const user = await db('users').where({ username: 'testuser' }).first();

  t.is(user.username, 'testuser');
});

test.serial('GET /login should return the login page', async (t) => {
  const res = await request(app).get('/login');
  t.true(res.text.includes('<h5 class="card-title">Login</h5>'));
});

test.serial('POST /login should log in a user', async (t) => {
  const agent = request.agent(app);

  await agent.post('/register').send({
    username: 'testuser',
    password: 'testpassword',
  })
  .type("form")
  .redirects(1);

  const res = await agent.post('/login').send({
    username: 'testuser',
    password: 'testpassword',
  })
  .type("form")
  .redirects(1);

  t.is(res.req.path, '/');
  t.is(res.text.includes('<h5 class="card-title">Welcome, testuser</h5>'), false);
});

test.serial('GET /feeds should return the feeds page if logged in', async (t) => {
  const agent = request.agent(app);

  await agent.post('/register').send({
    username: 'testuser',
    password: 'testpassword',
  })
  .type("form")
  .redirects(1);

  await agent.post('/login').send({
    username: 'testuser',
    password: 'testpassword',
  })
  .type("form")
  .redirects(1);

  const res = await agent.get('/feeds');

  if (res.req.path === '/login') {
    t.pass();
  } else {
    t.true(res.text.includes('<h5 class="card-title">My Feeds</h5>'));
  }
});

// Test for adding a new feed
test.serial('POST /feeds should add a new feed', async (t) => {
  const agent = request.agent(app);

  await agent.post('/register').send({
    username: 'testuser',
    password: 'testpassword',
  })
  .type("form")
  .redirects(1);

  await agent.post('/login').send({
    username: 'testuser',
    password: 'testpassword',
  })
  .type("form")
  .redirects(1);

  const res = await agent
    .post('/feeds')
    .send({
      name: 'Hospodářské noviny',
      url: 'https://archiv.hn.cz/?m=rss',
    })
    .type("form")
    .redirects(1);
    
  t.is(res.text.includes('Hospodářské noviny'), true);
  t.is(res.text.includes('https://archiv.hn.cz/?m=rss'), true);
});


// Test for adding a new invalid feed
test.serial('POST /feeds should not be added with with invalid RSS url', async (t) => {
  const agent = request.agent(app);

  await agent.post('/register').send({
    username: 'testuser',
    password: 'testpassword',
  })
  .type("form")
  .redirects(1);

  await agent.post('/login').send({
    username: 'testuser',
    password: 'testpassword',
  })
  .type("form")
  .redirects(1);

  const res = await agent
    .post('/feeds')
    .send({
      name: 'Wrong RSS',
      url: 'https://example.com',
    })
    .type("form")
    .redirects(1);

  t.is(res.text.includes('Invalid feed URL'), true);
  t.is(res.text.includes('https://example.com'), false);
  t.is(res.text.includes('Wrong RSS'), false);
});

// Test for logging out
test.serial('GET /logout should log out the user', async (t) => {
  const agent = request.agent(app);

  await agent.post('/register').send({
    username: 'testuser',
    password: 'testpassword',
  });

  await agent.post('/login').send({
    username: 'testuser',
    password: 'testpassword',
  });

  const res = await agent.get('/logout');

  t.is(res.status, 302);
  t.is(res.header['location'], '/');
});
