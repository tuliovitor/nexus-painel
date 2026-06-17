const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/agendamentos?usuario_id=X&status=Y
router.get('/', async (req, res) => {
  try {
    const { usuario_id, status } = req.query;

    let sql = 'SELECT * FROM agendamentos WHERE usuario_id = ?';
    let params = [usuario_id];

    if (status && status !== 'todas') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY data DESC, hora DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar agendamentos:', err);
    res.status(500).json({ erro: 'Erro ao buscar agendamentos.' });
  }
});

// GET /api/agendamentos/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM agendamentos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar agendamento:', err);
    res.status(500).json({ erro: 'Erro ao buscar agendamento.' });
  }
});

// POST /api/agendamentos
router.post('/', async (req, res) => {
  try {
    const { usuario_id, titulo, categoria, data, hora, descricao, status } = req.body;

    if (!usuario_id || !titulo || !data || !hora) {
      return res.status(400).json({ erro: 'usuario_id, titulo, data e hora são obrigatórios.' });
    }

    const [result] = await pool.query(
      'INSERT INTO agendamentos (usuario_id, titulo, categoria, data, hora, descricao, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [usuario_id, titulo, categoria || null, data, hora, descricao || null, status || 'agendada']
    );

    const [novo] = await pool.query('SELECT * FROM agendamentos WHERE id = ?', [result.insertId]);
    res.status(201).json(novo[0]);
  } catch (err) {
    console.error('Erro ao criar agendamento:', err);
    res.status(500).json({ erro: 'Erro ao criar agendamento.' });
  }
});

// PUT /api/agendamentos/:id
router.put('/:id', async (req, res) => {
  try {
    const { titulo, categoria, data, hora, descricao, status } = req.body;

    await pool.query(
      `UPDATE agendamentos SET
        titulo = COALESCE(?, titulo),
        categoria = COALESCE(?, categoria),
        data = COALESCE(?, data),
        hora = COALESCE(?, hora),
        descricao = COALESCE(?, descricao),
        status = COALESCE(?, status)
      WHERE id = ?`,
      [titulo, categoria, data, hora, descricao, status, req.params.id]
    );

    const [atualizado] = await pool.query('SELECT * FROM agendamentos WHERE id = ?', [req.params.id]);
    res.json(atualizado[0]);
  } catch (err) {
    console.error('Erro ao atualizar agendamento:', err);
    res.status(500).json({ erro: 'Erro ao atualizar agendamento.' });
  }
});

// PUT /api/agendamentos/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const statusValidos = ['agendada', 'rascunho', 'planejamento', 'cancelada'];

    if (!statusValidos.includes(status)) {
      return res.status(400).json({ erro: 'Status inválido.' });
    }

    await pool.query('UPDATE agendamentos SET status = ? WHERE id = ?', [status, req.params.id]);
    const [atualizado] = await pool.query('SELECT * FROM agendamentos WHERE id = ?', [req.params.id]);
    res.json(atualizado[0]);
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    res.status(500).json({ erro: 'Erro ao atualizar status.' });
  }
});

// DELETE /api/agendamentos/:id
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM agendamentos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    }
    res.json({ mensagem: 'Agendamento excluído com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir agendamento:', err);
    res.status(500).json({ erro: 'Erro ao excluir agendamento.' });
  }
});

module.exports = router;
