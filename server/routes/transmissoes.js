const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/transmissoes?usuario_id=X
router.get('/', async (req, res) => {
  try {
    const { usuario_id } = req.query;
    if (!usuario_id) return res.status(400).json({ erro: 'usuario_id é obrigatório.' });

    const [rows] = await pool.query(
      "SELECT * FROM transmissoes WHERE usuario_id = ? ORDER BY data_inicio DESC LIMIT 10",
      [usuario_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar transmissões:', err);
    res.status(500).json({ erro: 'Erro ao buscar transmissões.' });
  }
});

// POST /api/transmissoes/iniciar
router.post('/iniciar', async (req, res) => {
  try {
    const { usuario_id, titulo } = req.body;
    if (!usuario_id) return res.status(400).json({ erro: 'usuario_id é obrigatório.' });

    const [[config]] = await pool.query(
      'SELECT qualidade, bitrate, servidor_ingest FROM stream_config WHERE usuario_id = ?',
      [usuario_id]
    );

    const [result] = await pool.query(
      "INSERT INTO transmissoes (usuario_id, titulo, data_inicio, status, qualidade, bitrate, servidor) VALUES (?, ?, NOW(), 'ao_vivo', ?, ?, ?)",
      [usuario_id, titulo || 'Live sem título', config?.qualidade || '1080p', config?.bitrate || 6000, config?.servidor_ingest || 'São Paulo']
    );

    const [live] = await pool.query('SELECT * FROM transmissoes WHERE id = ?', [result.insertId]);
    res.status(201).json(live[0]);
  } catch (err) {
    console.error('Erro ao iniciar transmissão:', err);
    res.status(500).json({ erro: 'Erro ao iniciar transmissão.' });
  }
});

// PUT /api/transmissoes/:id/encerrar
router.put('/:id/encerrar', async (req, res) => {
  try {
    await pool.query(
      "UPDATE transmissoes SET data_fim = NOW(), status = 'encerrada' WHERE id = ?",
      [req.params.id]
    );
    res.json({ mensagem: 'Transmissão encerrada.' });
  } catch (err) {
    console.error('Erro ao encerrar transmissão:', err);
    res.status(500).json({ erro: 'Erro ao encerrar transmissão.' });
  }
});

// POST /api/transmissoes/:id/chat
router.post('/:id/chat', async (req, res) => {
  try {
    const { usuario_id, mensagem } = req.body;
    if (!usuario_id || !mensagem) {
      return res.status(400).json({ erro: 'usuario_id e mensagem são obrigatórios.' });
    }

    await pool.query(
      'INSERT INTO chat_mensagens (transmissao_id, usuario_id, mensagem) VALUES (?, ?, ?)',
      [req.params.id, usuario_id, mensagem]
    );

    res.status(201).json({ mensagem: 'Mensagem enviada.' });
  } catch (err) {
    console.error('Erro ao enviar chat:', err);
    res.status(500).json({ erro: 'Erro ao enviar mensagem.' });
  }
});

// GET /api/transmissoes/:id/chat
router.get('/:id/chat', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT cm.*, u.nome, u.avatar
       FROM chat_mensagens cm
       JOIN usuarios u ON u.id = cm.usuario_id
       WHERE cm.transmissao_id = ?
       ORDER BY cm.criado_em ASC LIMIT 50`,
      [req.params.id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar chat:', err);
    res.status(500).json({ erro: 'Erro ao buscar mensagens.' });
  }
});

module.exports = router;
