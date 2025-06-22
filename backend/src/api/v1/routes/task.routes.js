import express from "express";
import * as taskController from '../controllers/task.controllers.js';

const taskRoutes = express.Router();


/**
 * @openapi
 * /tasks:
 *  get:
 *     summary: Get all tasks
 *     description: Get all tasks
 *     responses:
 *      200:
 *         description: Success
 *      500:
 *         description: Internal Server Error
 */
taskRoutes.get("/tasks", taskController.getTasks);

/**
 * @swagger
 * /tasks/{id}:
 *  get:
 *     summary: Get task detail
 *     description: Get task detail
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Task id
 *     responses:
 *      200:
 *         description: Success
 *      500:
 *         description: Internal Server Error
 */
// taskRoutes.get("/tasks/:taskId",taskController.getTask);

/**
 * @openapi
 * /tasks:
 *  post:
 *      summary: Add task
 *      description: Add task
 *      requestBody:
 *          description: A JSON object containing task information
 *          content:
 *             application/json:
 *                 schema:
 *                    $ref: '#/components/schemas/Task'
 *                 example:
 *                    name: Rexaurus
 *      responses:
 *      200:
 *          description: Success
 *      500:
 *          description: Internal Server Error
 */
taskRoutes.post("/tasks", taskController.createTask);

/**
 * @openapi
 * /tasks/{id}:
 *  patch:
 *     summary: Edit tasks
 *     description: Edit task
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: task id
 *     requestBody:
 *       description: A JSON object containing task information
 *       content:
 *         application/json:
 *           schema:
 *              $ref: '#/components/schemas/Task'
 *           example:
 *              name: Rexaurus
 *     responses:
 *     200:
 *        description: Success
 *     500:
 *       description: Internal Server Error
 *
 */
taskRoutes.put("/tasks/:id", taskController.updateTask);

/**
 * @openapi
 * /tasks/{id}:
 *  delete:
 *     summary: Delete Task
 *     description: Delete Task
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Task Id
 *     responses:
 *     200:
 *        description: Success
 *     500:
 *       description: Internal Server Error
 */
taskRoutes.delete("/tasks/:id", taskController.deleteTask);

export default taskRoutes;