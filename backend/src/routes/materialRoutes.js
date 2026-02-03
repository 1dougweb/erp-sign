import express from 'express';
import { getMateriais, createMaterial, updateMaterial, deleteMaterial } from '../controllers/materialController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getMateriais);
router.post('/', createMaterial);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);

export default router;
