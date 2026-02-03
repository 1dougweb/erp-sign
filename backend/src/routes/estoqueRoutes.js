import express from 'express';
import { getEstoque, getMaterialById, calcularEstoqueAtual } from '../controllers/estoqueController.js';
import { getAll as getMovimentacoes, create as createMovimentacao, getById as getMovimentacaoById } from '../controllers/estoqueMovimentacaoController.js';
import { getAll as getCategorias, getById as getCategoriaById, create as createCategoria, update as updateCategoria, remove as removeCategoria } from '../controllers/categoriaController.js';
import { getAll as getUnidades, getById as getUnidadeById, create as createUnidade, update as updateUnidade, remove as removeUnidade } from '../controllers/unidadeMedidaController.js';
import { getAll as getFornecedores, getById as getFornecedorById, create as createFornecedor, update as updateFornecedor, remove as removeFornecedor } from '../controllers/fornecedorController.js';
import { getAll as getAlertas, marcarVisualizado, marcarResolvido, getCountNaoVisualizados } from '../controllers/estoqueAlertaController.js';
import { movimentacoesPorPeriodo, consumoPorMaterial, estoqueAtualVsMinimo, historicoRequisicoes } from '../controllers/estoqueRelatorioController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

router.use(authenticateToken);

// Rotas de estoque (visualização para todos, modificação apenas admin)
router.get('/', getEstoque);
router.get('/material/:id', getMaterialById);
router.post('/material/:id/calcular', isAdmin, calcularEstoqueAtual);

// Rotas de movimentações (apenas admin)
router.get('/movimentacoes', isAdmin, getMovimentacoes);
router.get('/movimentacoes/:id', isAdmin, getMovimentacaoById);
router.post('/movimentacoes', isAdmin, createMovimentacao);

// Rotas de categorias (apenas admin)
router.get('/categorias', getCategorias);
router.get('/categorias/:id', getCategoriaById);
router.post('/categorias', isAdmin, createCategoria);
router.put('/categorias/:id', isAdmin, updateCategoria);
router.delete('/categorias/:id', isAdmin, removeCategoria);

// Rotas de unidades de medida (apenas admin)
router.get('/unidades', getUnidades);
router.get('/unidades/:id', getUnidadeById);
router.post('/unidades', isAdmin, createUnidade);
router.put('/unidades/:id', isAdmin, updateUnidade);
router.delete('/unidades/:id', isAdmin, removeUnidade);

// Rotas de fornecedores (apenas admin)
router.get('/fornecedores', getFornecedores);
router.get('/fornecedores/:id', getFornecedorById);
router.post('/fornecedores', isAdmin, createFornecedor);
router.put('/fornecedores/:id', isAdmin, updateFornecedor);
router.delete('/fornecedores/:id', isAdmin, removeFornecedor);

// Rotas de alertas
router.get('/alertas', getAlertas);
router.put('/alertas/:id/visualizado', marcarVisualizado);
router.put('/alertas/:id/resolvido', marcarResolvido);
router.get('/alertas/nao-visualizados', getCountNaoVisualizados);

// Rotas de relatórios (apenas admin)
router.get('/relatorios/movimentacoes', isAdmin, movimentacoesPorPeriodo);
router.get('/relatorios/consumo', isAdmin, consumoPorMaterial);
router.get('/relatorios/estoque-vs-minimo', isAdmin, estoqueAtualVsMinimo);
router.get('/relatorios/requisicoes', isAdmin, historicoRequisicoes);

export default router;
