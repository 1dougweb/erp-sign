import express from 'express';
import { getAll, getByMaterial, create, update, remove } from '../controllers/materialPrecoController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

// Rotas públicas (autenticadas) para consulta
router.get('/', authenticateToken, getAll);
router.get('/material/:materialId', authenticateToken, getByMaterial);

// Rotas protegidas (apenas admin) para modificação
router.post('/', authenticateToken, isAdmin, create);
router.put('/:id', authenticateToken, isAdmin, update);
router.delete('/:id', authenticateToken, isAdmin, remove);

export default router;
