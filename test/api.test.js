const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('Todo API supports CRUD, filters, and validation', async () => {
  const getTodos = async (path) => {
    const response = await fetch(`${baseUrl}${path}`);
    return { response, body: response.status === 204 ? null : await response.json() };
  };

  const { response: listResponse, body: initialTodos } = await getTodos('/todos');
  assert.equal(listResponse.status, 200);
  assert.ok(initialTodos.length >= 2);

  const { response: detailResponse, body: existingTodo } = await getTodos('/todos/1');
  assert.equal(detailResponse.status, 200);
  assert.equal(existingTodo.id, 1);

  const { response: activeResponse, body: activeTodos } = await getTodos('/todos/active');
  assert.equal(activeResponse.status, 200);
  assert.ok(activeTodos.every((todo) => todo.completed === false));

  const { response: completedResponse, body: completedTodos } = await getTodos('/todos/completed');
  assert.equal(completedResponse.status, 200);
  assert.ok(completedTodos.every((todo) => todo.completed === true));

  const missingTaskResponse = await fetch(`${baseUrl}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: false }),
  });
  assert.equal(missingTaskResponse.status, 400);
  assert.match((await missingTaskResponse.json()).error, /task field is required/i);

  const createResponse = await fetch(`${baseUrl}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: '  Write API tests  ' }),
  });
  assert.equal(createResponse.status, 201);
  const createdTodo = await createResponse.json();
  assert.equal(createdTodo.task, 'Write API tests');
  assert.equal(createdTodo.completed, false);
  assert.ok(createdTodo.id > 2);

  const { response: createdDetailResponse, body: createdDetail } = await getTodos(`/todos/${createdTodo.id}`);
  assert.equal(createdDetailResponse.status, 200);
  assert.deepEqual(createdDetail, createdTodo);

  const updateResponse = await fetch(`${baseUrl}/todos/${createdTodo.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: true }),
  });
  assert.equal(updateResponse.status, 200);
  assert.deepEqual(await updateResponse.json(), { ...createdTodo, completed: true });

  const { body: activeAfterUpdate } = await getTodos('/todos/active');
  assert.ok(!activeAfterUpdate.some((todo) => todo.id === createdTodo.id));
  const { body: completedAfterUpdate } = await getTodos('/todos/completed');
  assert.ok(completedAfterUpdate.some((todo) => todo.id === createdTodo.id));

  const deleteResponse = await fetch(`${baseUrl}/todos/${createdTodo.id}`, { method: 'DELETE' });
  assert.equal(deleteResponse.status, 204);

  const { response: deletedDetailResponse } = await getTodos(`/todos/${createdTodo.id}`);
  assert.equal(deletedDetailResponse.status, 404);
  const repeatedDeleteResponse = await fetch(`${baseUrl}/todos/${createdTodo.id}`, { method: 'DELETE' });
  assert.equal(repeatedDeleteResponse.status, 404);

  const invalidIdResponse = await fetch(`${baseUrl}/todos/not-an-id`);
  assert.equal(invalidIdResponse.status, 400);
  const partiallyNumericIdResponse = await fetch(`${baseUrl}/todos/1abc`);
  assert.equal(partiallyNumericIdResponse.status, 400);

  const malformedJsonResponse = await fetch(`${baseUrl}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"task":',
  });
  assert.equal(malformedJsonResponse.status, 400);
});
