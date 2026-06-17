const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const agendamentoRoutes = require('./routes/agendamentos');
const metricaRoutes = require('./routes/metricas');
const membroRoutes = require('./routes/membros');
const transmissaoRoutes = require('./routes/transmissoes');
const configRoutes = require('./routes/config');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/metricas', metricaRoutes);
app.use('/api/membros', membroRoutes);
app.use('/api/transmissoes', transmissaoRoutes);
app.use('/api/config', configRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', projeto: 'Nexus Painel' });
});

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '..')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  Nexus Painel API rodando em http://localhost:${PORT}\n`);
});
