import express from 'express';
import { getCarros, createCarro, updateCarro, deleteCarro } from '../controllers/carroController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getCarros);
router.post('/', createCarro);
router.put('/:id', updateCarro);
router.delete('/:id', deleteCarro);

export default router;
