let tasks = [];
let idCounter = 1;

export const getAllTasks = () => tasks;

export const getTaskById = (id) => tasks.find(task => task.id === id);

export const createTask = ({ title, description }) => {
  // Check duplicate: title and description both same
  const exists = tasks.some(task => task.title === title && task.description === description);
  if (exists) return null;

  const newTask = { id: idCounter++, title, description };
  tasks.push(newTask);
  return newTask;
};

export const updateTask = (id, { title, description }) => {
  const task = getTaskById(id);
  if (!task) return null;

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;

  return task;
};

export const deleteTask = (id) => {
  const index = tasks.findIndex(task => task.id === id);
  if (index === -1) return false;

  tasks.splice(index, 1);
  return true;
};