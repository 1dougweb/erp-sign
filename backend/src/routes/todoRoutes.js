import express from 'express';
import { getTodos, createTodo, updateTodo, deleteTodo, reordenarTodos } from '../controllers/todoController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/tarefas/:tarefaId/todos', getTodos);
router.post('/tarefas/:tarefaId/todos', createTodo);
router.post('/tarefas/:tarefaId/todos/reorder', reordenarTodos);
router.put('/todos/:id', updateTodo);
router.delete('/todos/:id', deleteTodo);

export default router;
