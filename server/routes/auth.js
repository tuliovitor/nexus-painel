const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const pool = require('../db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { nome, username, email, senha } = req.body;

    if (!nome || !username || !email || !senha) {
      return res.status(400).json({ erro: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }
    if (senha.length < 8) {
      return res.status(400).json({ erro: 'Senha deve ter no mínimo 8 caracteres.' });
    }

    const [existentes] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ? OR username = ? LIMIT 1',
      [email, username]
    );
    if (existentes.length > 0) {
      return res.status(409).json({ erro: 'E-mail ou usuário já cadastrado.' });
    }

    const senha_hash = await bcrypt.hash(senha, 10);
    const stream_key = 'NXS-' + Array.from({ length: 12 }, () =>
      'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
    ).join('').match(/.{4}/g).join('-');

    const [result] = await pool.query(
      'INSERT INTO usuarios (nome, username, email, senha_hash, stream_key) VALUES (?, ?, ?, ?, ?)',
      [nome, username, email, senha_hash, stream_key]
    );

    await pool.query(
      'INSERT INTO stream_config (usuario_id) VALUES (?)',
      [result.insertId]
    );

    const usuario = { id: result.insertId, nome, username, email, avatar: null, bio: null, stream_key };

    res.status(201).json({ mensagem: 'Conta criada com sucesso!', usuario });
  } catch (err) {
    console.error('Erro em register:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    const [rows] = await pool.query(
      'SELECT id, nome, username, email, senha_hash, avatar, bio, stream_key FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const usuario = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const { senha_hash, ...dadosPublicos } = usuario;

    res.json({ mensagem: 'Login realizado com sucesso!', usuario: dadosPublicos });
  } catch (err) {
    console.error('Erro em login:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ erro: 'Informe o e-mail.' });
    }

    const [rows] = await pool.query('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [email]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'E-mail não encontrado.' });
    }

    // Em produção: enviar e-mail com token. Aqui simulamos.
    res.json({ mensagem: 'Link de redefinição enviado para o e-mail.' });
  } catch (err) {
    console.error('Erro em forgot-password:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ erro: 'user_id é obrigatório.' });

    const [rows] = await pool.query(
      'SELECT id, nome, username, email, avatar, bio, stream_key FROM usuarios WHERE id = ? LIMIT 1',
      [userId]
    );

    if (rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro em me:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', async (req, res) => {
  try {
    const { user_id, nome, username, bio, avatar } = req.body;
    if (!user_id) return res.status(400).json({ erro: 'user_id é obrigatório.' });

    await pool.query(
      'UPDATE usuarios SET nome = COALESCE(?, nome), username = COALESCE(?, username), bio = COALESCE(?, bio), avatar = COALESCE(?, avatar) WHERE id = ?',
      [nome, username, bio, avatar, user_id]
    );

    res.json({ mensagem: 'Perfil atualizado com sucesso!' });
  } catch (err) {
    console.error('Erro em profile:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

module.exports = router;
