# Week 3 Todo CRUD API

A small Express API for creating, reading, updating, deleting, and filtering todos. Todos are stored in memory, so they reset to the sample items whenever the server restarts.

## Run the API

Install dependencies and start the server:

```sh
npm install
npm start
```

The API listens on port `3002` by default. Set the `PORT` environment variable to use a different port.

## Run the tests

```sh
npm test
```

## Endpoints

All responses use JSON except successful deletes, which return an empty `204` response.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/todos` | List all todos |
| `GET` | `/todos/:id` | Retrieve one todo by ID |
| `GET` | `/todos/active` | List todos with `completed: false` |
| `GET` | `/todos/completed` | List todos with `completed: true` |
| `POST` | `/todos` | Create a todo |
| `PATCH` | `/todos/:id` | Update a todo's task and/or completion state |
| `DELETE` | `/todos/:id` | Delete a todo |

Creating a todo requires a non-empty string `task`. The optional `completed` value must be a boolean and defaults to `false`:

```sh
curl -i -X POST http://localhost:3002/todos \
  -H 'Content-Type: application/json' \
  -d '{"task":"Practice Express"}'
```

Read, update, and delete examples:

```sh
curl http://localhost:3002/todos
curl http://localhost:3002/todos/1
curl http://localhost:3002/todos/active
curl http://localhost:3002/todos/completed

curl -i -X PATCH http://localhost:3002/todos/1 \
  -H 'Content-Type: application/json' \
  -d '{"completed":true}'

curl -i -X DELETE http://localhost:3002/todos/1
```

The API returns `400` for invalid IDs, invalid JSON, or invalid input; `404` when a todo does not exist; `201` when a todo is created; `200` for successful reads and updates; and `204` for a successful delete.
