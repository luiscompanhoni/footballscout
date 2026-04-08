require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const obrasRoutes = require('./routes/obras');
const orcamentosRoutes = require('./routes/orcamentos');
const etapasRoutes = require('./routes/etapas');
const equipeRoutes = require('./routes/equipe');
const materiaisRoutes = require('./routes/materiais');
const diarioRoutes = require('./routes/diario');
const relatoriosRoutes = require('./routes/relatorios');
const notificacoesRoutes = require('./routes/notificacoes');
const clienteRoutes = require('./routes/cliente');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: 'Muitas requisições, tente novamente em 15 minutos.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (uploads locais em dev)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/obras', obrasRoutes);
app.use('/api/orcamentos', orcamentosRoutes);
app.use('/api/etapas', etapasRoutes);
app.use('/api/equipe', equipeRoutes);
app.use('/api/materiais', materiaisRoutes);
app.use('/api/diario', diarioRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/cliente', clienteRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📦 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
