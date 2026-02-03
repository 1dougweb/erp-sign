import express from 'express';
import { getTarefas, createTarefa, updateTarefa, deleteTarefa, reordenarTarefas } from '../controllers/tarefaController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/projetos/:projetoId/tarefas', getTarefas);
router.post('/projetos/:projetoId/tarefas', createTarefa);
router.put('/tarefas/reordenar', reordenarTarefas); // Deve vir antes da rota com :id
router.put('/tarefas/:id', updateTarefa);
router.delete('/tarefas/:id', deleteTarefa);

export default router;
