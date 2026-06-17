const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/membros?usuario_id=X&nivel=Y
router.get('/', async (req, res) => {
  try {
    const { usuario_id, nivel, busca } = req.query;

    let sql = 'SELECT * FROM membros WHERE usuario_id = ?';
    let params = [usuario_id];

    if (nivel && nivel !== 'todos') {
      sql += ' AND nivel = ?';
      params.push(nivel);
    }

    if (busca) {
      sql += ' AND (nome LIKE ? OR username LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`);
    }

    sql += ' ORDER BY seguidores DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar membros:', err);
    res.status(500).json({ erro: 'Erro ao buscar membros.' });
  }
});

// GET /api/membros/niveis?usuario_id=X
router.get('/niveis', async (req, res) => {
  try {
    const { usuario_id } = req.query;
    if (!usuario_id) return res.status(400).json({ erro: 'usuario_id é obrigatório.' });

    const [rows] = await pool.query(
      `SELECT nivel, COUNT(*) AS total FROM membros WHERE usuario_id = ? GROUP BY nivel ORDER BY FIELD(nivel, 'VIP','MOD','SUB','NEW')`,
      [usuario_id]
    );

    const niveis = { VIP: 0, MOD: 0, SUB: 0, NEW: 0 };
    rows.forEach(r => { niveis[r.nivel] = r.total; });

    res.json(niveis);
  } catch (err) {
    console.error('Erro ao buscar níveis:', err);
    res.status(500).json({ erro: 'Erro ao buscar níveis.' });
  }
});

module.exports = router;
