import express from 'express';
import { getFuncionarios, createFuncionario, updateFuncionario, deleteFuncionario } from '../controllers/funcionarioController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getFuncionarios);
router.post('/', createFuncionario);
router.put('/:id', updateFuncionario);
router.delete('/:id', deleteFuncionario);

export default router;
