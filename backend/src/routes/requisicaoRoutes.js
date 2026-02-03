import express from 'express';
import { getAll, getById, create, aprovar, cancelar } from '../controllers/requisicaoController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

router.use(authenticateToken);

// Rotas de requisições
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id/aprovar', isAdmin, aprovar);
router.put('/:id/cancelar', cancelar);

export default router;
