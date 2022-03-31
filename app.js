const express = require("express");
const path = require("path");
const fs = require("fs").promises;

let todos = [];

// Read the todos from the file
const readTodos = async () => {
  try {
    const data = await fs.readFile("./data/todo.json");
    todos = JSON.parse(data);
  } catch (error) {
    throw error;
  }
};

// Write the todos to the file
const writeTodos = async (newTodos) => {
  try {
    await fs.writeFile("./data/todo.json", JSON.stringify(newTodos));
    return true;
  } catch (error) {
    throw error;
  }
};

// APP VARS
const app = express();
const PORT = process.env.PORT | 3000;

// MIDDLEWARE for body-parser
app.use(
  express.urlencoded({
    extended: true,
  })
);

// Set the templating engine
app.set("view engine", "pug");

// Set path to views and public, and the engine
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// ###################### ENDPOINTS ######################

// Returns index page
app.get("/", async (req, res) => {
  
  // When other pages redirect to index, they may send 
  // query params (error, success) to display messages.
  // here those messages are extracted and corresponding message is rendered.
  const error = req.query.error;
  const success = req.query.success;

  let successMessage = "";
  let errorMessage = "";
  if (error === "invalidInput") errorMessage = "Title and description must be given.";
  if (error === "create") errorMessage = "Failed to create a new item.";
  if (error === "update") errorMessage = "Failed to update the item.";
  if (error === "delete") errorMessage = "Failed to delete the item.";
  if (error === "done") errorMessage = "Failed to mark the item as done.";

  if (success === "create") successMessage = "New item successfuly created.";
  if (success === "update") successMessage = "Item was updated successfuly.";
  if (success === "delete") successMessage = "Item was deleted successfuly.";
  if (success === "done") successMessage = "Item was marked as done successfuly.";

  return res.render("index", { title: "Home", todos, error: errorMessage, success: successMessage });
});

// Returns all todos
app.get("/tasks/all", async (_, res) => {
  return res.render("allTodos", { title: "My TODOs", todos });
});

// Returns all done todos
app.get("/tasks/done", async (_, res) => {
  const doneTodos = todos.filter((todo) => todo.done);
  return res.render("doneTodos", { title: "Completed TODOs", todos: doneTodos });
});

// Creates a new todo
app.post("/tasks", async (req, res) => {
  const newTodo = req.body;
  // Create a random id
  const id = Math.floor(Math.random() * 100000);

  if (newTodo.title.trim() === "" || newTodo.description.trim() === "") {
    return res.redirect("/?error=invalidInput");
  }

  todos.unshift({
    id,
    title: newTodo.title,
    description: newTodo.description,
    done: false,
  });

  // after writing the new todo, redirect to index page
  // with query params (messages) to be shown
  const writeRes = await writeTodos(todos);
  if (!writeRes) {
    return res.redirect("/?error=create");
  }
  return res.redirect("/?success=create");
});

// Updates the todo with the given id
app.post("/tasks/:todoId", async (req, res) => {
  // Get the id of the todo to be updated
  const todoId = parseInt(req.params.todoId);
  const todoToUpdate = todos.find((todo) => todo.id === todoId);
  todoToUpdate.title = req.body.title;
  todoToUpdate.description = req.body.description;

  const writeRes = await writeTodos(todos);
  if (!writeRes) {
    return res.redirect("/?error=update");
  }
  return res.redirect("/?success=update");
});

// Renders the todo update modal
app.get("/tasks/:todoId", async (req, res) => {
  // Get the id of the todo to be updated
  const todoId = parseInt(req.params.todoId);
  const todoToUpdate = todos.find((todo) => todo.id === todoId);
  return res.render("index", { title: "Home", todos, todoToUpdate });
});

// Deletes the todo with the given id
app.post("/tasks/delete/:todoId", async (req, res) => {
  // Get the id of the todo to be deleted
  const todoId = parseInt(req.params.todoId);
  const todoToDelete = todos.findIndex((todo) => todo.id === todoId);
  todos.splice(todoToDelete, 1);

  const writeRes = await writeTodos(todos);
  if (!writeRes) {
    return res.redirect("/?error=delete");
  }
  return res.redirect("/?success=delete");
});

// Sets the todo with the given id as done
app.get("/tasks/done/:todoId", async (req, res) => {
  // Get the id of the todo to be set as done
  const todoId = parseInt(req.params.todoId);
  todos.find((todo) => todo.id === todoId).done = true;
  const writeRes = await writeTodos(todos);
  if (!writeRes) {
    return res.redirect("/?error=done");
  }
  return res.redirect("/?success=done");
});


// Start the server
app.listen(PORT, async () => {
  await readTodos();
  console.log('App is running on Port 3000');
});

