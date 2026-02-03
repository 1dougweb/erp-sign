import express from 'express';
import { getAll, getById, create, update, remove, calcularTotal } from '../controllers/orcamentoController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.post('/:id/calcular-total', calcularTotal);

export default router;
