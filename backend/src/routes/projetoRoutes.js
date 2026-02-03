import express from 'express';
import { getProjetos, createProjeto, updateProjeto, deleteProjeto } from '../controllers/projetoController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getProjetos);
router.post('/', createProjeto);
router.put('/:id', updateProjeto);
router.delete('/:id', deleteProjeto);

export default router;
