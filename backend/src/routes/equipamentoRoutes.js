import express from 'express';
import { getAll, getById, create, update, remove, emprestar, devolver } from '../controllers/equipamentoController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

// Todas as rotas de equipamentos requerem admin
router.use(authenticateToken);
router.use(isAdmin);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.post('/:id/emprestar', emprestar);
router.post('/:id/devolver', devolver);

export default router;
