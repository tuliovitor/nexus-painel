const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const pool = require('../db');

// GET /api/config?usuario_id=X
router.get('/', async (req, res) => {
  try {
    const { usuario_id } = req.query;
    if (!usuario_id) return res.status(400).json({ erro: 'usuario_id é obrigatório.' });

    let [rows] = await pool.query('SELECT * FROM stream_config WHERE usuario_id = ?', [usuario_id]);

    if (rows.length === 0) {
      await pool.query('INSERT INTO stream_config (usuario_id) VALUES (?)', [usuario_id]);
      [rows] = await pool.query('SELECT * FROM stream_config WHERE usuario_id = ?', [usuario_id]);
    }

    const config = rows[0];
    delete config.id;
    delete config.usuario_id;

    res.json(config);
  } catch (err) {
    console.error('Erro ao buscar config:', err);
    res.status(500).json({ erro: 'Erro ao buscar configurações.' });
  }
});

// PUT /api/config
router.put('/', async (req, res) => {
  try {
    const { usuario_id, qualidade, bitrate, servidor_ingest, notif_seguidores, notif_gift, notif_lembrete, notif_relatorio } = req.body;

    if (!usuario_id) return res.status(400).json({ erro: 'usuario_id é obrigatório.' });

    await pool.query(
      `UPDATE stream_config SET
        qualidade = COALESCE(?, qualidade),
        bitrate = COALESCE(?, bitrate),
        servidor_ingest = COALESCE(?, servidor_ingest),
        notif_seguidores = COALESCE(?, notif_seguidores),
        notif_gift = COALESCE(?, notif_gift),
        notif_lembrete = COALESCE(?, notif_lembrete),
        notif_relatorio = COALESCE(?, notif_relatorio)
      WHERE usuario_id = ?`,
      [qualidade, bitrate, servidor_ingest, notif_seguidores, notif_gift, notif_lembrete, notif_relatorio, usuario_id]
    );

    res.json({ mensagem: 'Configurações salvas com sucesso!' });
  } catch (err) {
    console.error('Erro ao salvar config:', err);
    res.status(500).json({ erro: 'Erro ao salvar configurações.' });
  }
});

// PUT /api/config/change-password
router.put('/change-password', async (req, res) => {
  try {
    const { usuario_id, senha_atual, nova_senha } = req.body;

    if (!usuario_id || !senha_atual || !nova_senha) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
    }

    const [rows] = await pool.query('SELECT senha_hash FROM usuarios WHERE id = ?', [usuario_id]);
    if (rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    const valida = await bcrypt.compare(senha_atual, rows[0].senha_hash);
    if (!valida) return res.status(401).json({ erro: 'Senha atual incorreta.' });

    const nova_hash = await bcrypt.hash(nova_senha, 10);
    await pool.query('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [nova_hash, usuario_id]);

    res.json({ mensagem: 'Senha alterada com sucesso!' });
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    res.status(500).json({ erro: 'Erro ao alterar senha.' });
  }
});

// POST /api/config/regenerate-key
router.post('/regenerate-key', async (req, res) => {
  try {
    const { usuario_id } = req.body;
    if (!usuario_id) return res.status(400).json({ erro: 'usuario_id é obrigatório.' });

    const stream_key = 'NXS-' + Array.from({ length: 12 }, () =>
      'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
    ).join('').match(/.{4}/g).join('-');

    await pool.query('UPDATE usuarios SET stream_key = ? WHERE id = ?', [stream_key, usuario_id]);

    res.json({ stream_key });
  } catch (err) {
    console.error('Erro ao regenerar key:', err);
    res.status(500).json({ erro: 'Erro ao regenerar stream key.' });
  }
});

module.exports = router;
