const express = require('express');
const app = express();
app.use(express.json()); // Parse JSON bodies

let todos = [
  { id: 1, task: 'Learn Node.js', completed: false },
  { id: 2, task: 'Build CRUD API', completed: false },
];
let nextTodoId = Math.max(...todos.map((todo) => todo.id)) + 1;

const parseTodoId = (value) => {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// GET All – Read
app.get('/todos', (req, res) => {
  res.status(200).json(todos); // Send array as JSON
});

// GET Active – Read filtered todos
app.get('/todos/active', (req, res) => {
  res.status(200).json(todos.filter((todo) => todo.completed === false));
});

// GET Completed – Read filtered todos
app.get('/todos/completed', (req, res) => {
  res.status(200).json(todos.filter((todo) => todo.completed === true));
});

// POST New – Create
app.post('/todos', (req, res) => {
  const { task, completed = false } = req.body ?? {};
  if (typeof task !== 'string' || task.trim() === '') {
    return res.status(400).json({ error: 'The task field is required.' });
  }
  if (typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'The completed field must be a boolean.' });
  }

  const newTodo = { id: nextTodoId++, task: task.trim(), completed };
  todos.push(newTodo);
  res.status(201).json(newTodo); // Echo back
});

// GET One – Read by ID
app.get('/todos/:id', (req, res) => {
  const id = parseTodoId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Todo ID must be a positive integer.' });
  }

  const todo = todos.find((item) => item.id === id);
  if (!todo) return res.status(404).json({ error: 'Todo not found.' });
  res.status(200).json(todo);
});

// PATCH Update – Partial
app.patch('/todos/:id', (req, res) => {
  const id = parseTodoId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Todo ID must be a positive integer.' });
  }

  const todo = todos.find((item) => item.id === id);
  if (!todo) return res.status(404).json({ error: 'Todo not found.' });

  const updates = req.body;
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ error: 'Request body must be a JSON object.' });
  }
  if (Object.hasOwn(updates, 'task')) {
    if (typeof updates.task !== 'string' || updates.task.trim() === '') {
      return res.status(400).json({ error: 'The task field cannot be empty.' });
    }
    todo.task = updates.task.trim();
  }
  if (Object.hasOwn(updates, 'completed')) {
    if (typeof updates.completed !== 'boolean') {
      return res.status(400).json({ error: 'The completed field must be a boolean.' });
    }
    todo.completed = updates.completed;
  }

  res.status(200).json(todo);
});

// DELETE Remove
app.delete('/todos/:id', (req, res) => {
  const id = parseTodoId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Todo ID must be a positive integer.' });
  }

  const initialLength = todos.length;
  todos = todos.filter((t) => t.id !== id); // Array.filter() – non-destructive
  if (todos.length === initialLength)
    return res.status(404).json({ error: 'Todo not found.' });
  res.status(204).send(); // Silent success
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  }
  res.status(500).json({ error: 'Server error!' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => console.log(`Server on port ${PORT}`));
}

module.exports = app;
