const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/metricas?usuario_id=X
router.get('/', async (req, res) => {
  try {
    const { usuario_id } = req.query;
    if (!usuario_id) return res.status(400).json({ erro: 'usuario_id é obrigatório.' });

    // Métricas da última semana
    const [diarias] = await pool.query(
      'SELECT * FROM metricas_diarias WHERE usuario_id = ? ORDER BY data ASC LIMIT 7',
      [usuario_id]
    );

    // Totais agregados
    const [[totais]] = await pool.query(
      `SELECT
        COALESCE(SUM(visualizacoes),0) AS total_views,
        COALESCE(SUM(novos_seguidores),0) AS total_followers,
        COALESCE(SUM(horas_transmitidas),0) AS total_hours,
        COALESCE(ROUND(AVG(avg_espectadores)),0) AS avg_viewers,
        COALESCE(MAX(pico_espectadores),0) AS peak_viewers,
        COALESCE(SUM(chat_mensagens),0) AS total_chat
      FROM metricas_diarias WHERE usuario_id = ?`,
      [usuario_id]
    );

    // Total de seguidores (da tabela membros)
    const [[seguidores]] = await pool.query(
      'SELECT COALESCE(SUM(seguidores),0) AS total_seguidores FROM membros WHERE usuario_id = ?',
      [usuario_id]
    );

    res.json({
      diarias,
      totais: {
        ...totais,
        total_seguidores: seguidores.total_seguidores
      }
    });
  } catch (err) {
    console.error('Erro ao buscar métricas:', err);
    res.status(500).json({ erro: 'Erro ao buscar métricas.' });
  }
});

// GET /api/metricas/online?usuario_id=X
router.get('/online', async (req, res) => {
  try {
    const { usuario_id } = req.query;
    if (!usuario_id) return res.status(400).json({ erro: 'usuario_id é obrigatório.' });

    const [[row]] = await pool.query(
      `SELECT COUNT(*) AS online FROM membros WHERE usuario_id = ?
       AND ultima_visita >= NOW() - INTERVAL 15 MINUTE`,
      [usuario_id]
    );

    res.json({ online: row.online });
  } catch (err) {
    console.error('Erro ao buscar online:', err);
    res.status(500).json({ erro: 'Erro ao buscar online.' });
  }
});

module.exports = router;
