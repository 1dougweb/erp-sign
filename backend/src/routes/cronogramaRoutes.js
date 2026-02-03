import express from 'express';
import { getCronogramas, createCronograma, updateCronograma, deleteCronograma, getOrcamentos, getTiposInstalacao, updateMaterialQuantidade } from '../controllers/cronogramaController.js';
import { getCronogramaTodos, createCronogramaTodo, updateCronogramaTodo, deleteCronogramaTodo, reorderCronogramaTodos } from '../controllers/cronogramaTodoController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getCronogramas);
router.post('/', createCronograma);
router.put('/:id', updateCronograma);
router.delete('/:id', deleteCronograma);
router.put('/:cronogramaId/materiais/:materialId/quantidade', updateMaterialQuantidade);
router.get('/orcamentos', getOrcamentos);
router.get('/tipos-instalacao', getTiposInstalacao);

// Rotas de todos do cronograma
router.get('/:id/todos', getCronogramaTodos);
router.post('/:id/todos', createCronogramaTodo);
router.put('/:id/todos/:todoId', updateCronogramaTodo);
router.delete('/:id/todos/:todoId', deleteCronogramaTodo);
router.post('/:id/todos/reorder', reorderCronogramaTodos);

export default router;
