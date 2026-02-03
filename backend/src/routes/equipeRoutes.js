import express from 'express';
import { getEquipes, createEquipe, updateEquipe, deleteEquipe, addFuncionarioToEquipe, removeFuncionarioFromEquipe } from '../controllers/equipeController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getEquipes);
router.post('/', createEquipe);
router.put('/:id', updateEquipe);
router.delete('/:id', deleteEquipe);
router.post('/:id/funcionarios', addFuncionarioToEquipe);
router.delete('/:id/funcionarios/:funcionarioId', removeFuncionarioFromEquipe);

export default router;
