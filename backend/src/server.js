import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// WebSocket removido
import authRoutes from './routes/authRoutes.js';
import projetoRoutes from './routes/projetoRoutes.js';
import tarefaRoutes from './routes/tarefaRoutes.js';
import todoRoutes from './routes/todoRoutes.js';
import funcionarioRoutes from './routes/funcionarioRoutes.js';
import equipeRoutes from './routes/equipeRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import materialPrecoRoutes from './routes/materialPrecoRoutes.js';
import carroRoutes from './routes/carroRoutes.js';
import cronogramaRoutes from './routes/cronogramaRoutes.js';
import orcamentoRoutes from './routes/orcamentoRoutes.js';
import estoqueRoutes from './routes/estoqueRoutes.js';
import requisicaoRoutes from './routes/requisicaoRoutes.js';
import equipamentoRoutes from './routes/equipamentoRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// WebSocket removido

// Manual CORS implementation - Maximally permissive for troubleshooting
app.use((req, res, next) => {
  // Debug log to see what's happening on the server
  console.log(`[CORS] Method: ${req.method} Path: ${req.path} Origin: ${req.headers.origin}`);

  const origin = req.headers.origin;

  // Dynamically set Access-Control-Allow-Origin to the request origin
  // This allows any domain to access the API with credentials
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // If no origin (e.g. server-to-server or Curl), allow all (but credentials might be ignored)
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/projetos', projetoRoutes);
app.use('/api', tarefaRoutes);
app.use('/api', todoRoutes);
app.use('/api/funcionarios', funcionarioRoutes);
app.use('/api/equipes', equipeRoutes);
app.use('/api/materiais', materialRoutes);
app.use('/api/material-precos', materialPrecoRoutes);
app.use('/api/carros', carroRoutes);
app.use('/api/cronogramas', cronogramaRoutes);
app.use('/api/orcamentos', orcamentoRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/requisicoes', requisicaoRoutes);
app.use('/api/equipamentos', equipamentoRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API funcionando' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse localmente: http://localhost:${PORT}`);
  console.log(`Acesse pela rede: http://[SEU_IP]:${PORT}`);
});
