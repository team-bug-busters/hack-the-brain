import * as taskModel from '../models/task.models.js';

export const getTasks = (req, res) => {
  try {
    const search = req.query.search?.toLowerCase() || '';
    const tasks = taskModel.getAllTasks();

    const filteredTasks = search
      ? tasks.filter(task =>
          task.title.toLowerCase().includes(search) ||
          task.description.toLowerCase().includes(search)
        )
      : tasks;

    return res.json({ success: true, data: filteredTasks });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks',
      error: error.message
    });
  }
};

export const createTask = (req, res) => {
  const { title, description } = req.body;

  if ((!title || title.trim() === '') && (!description || description.trim() === '')) {
    return res.status(400).json({ success: false, message: 'Please provide at least a title or description' });
  }

  try {
    const newTask = taskModel.createTask({ title: title?.trim() || '', description: description?.trim() || '' });
    if (!newTask) {
      // Duplicate task found
      return res.status(409).json({ success: false, message: 'Task with same title and description already exists' });
    }
    return res.status(201).json({ success: true, data: newTask });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create task', error: error.message });
  }
};

export const updateTask = (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid task ID' });
  }

  const { title, description } = req.body;
  console.log(req.body)
  if ((title === undefined || title.trim() === '') && (description === undefined || description.trim() === '')) {
    return res.status(400).json({ success: false, message: 'Provide title or description to update' });
  }

  try {
    const updatedTask = taskModel.updateTask(id, {
      title: title?.trim(),
      description: description?.trim(),
    });

    if (!updatedTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.json({ success: true, data: updatedTask });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update task', error: error.message });
  }
};

export const deleteTask = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid task ID' });
  }

  try {
    const deleted = taskModel.deleteTask(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.status(204).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete task', error: error.message });
  }
};