const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { sendPasswordReset } = require('../services/email');

const router = express.Router();
const prisma = new PrismaClient();

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
router.post(
  '/register',
  [
    body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('E-mail inválido').normalizeEmail(),
    body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
    body('role').optional().isIn(['ADMIN', 'CLIENTE']).withMessage('Perfil inválido'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nome, email, senha, role } = req.body;
    try {
      const exists = await prisma.usuario.findUnique({ where: { email } });
      if (exists) return res.status(409).json({ error: 'E-mail já cadastrado' });

      const senhaHash = await bcrypt.hash(senha, 12);
      const usuario = await prisma.usuario.create({
        data: { nome, email, senhaHash, role: role || 'CLIENTE' },
        select: { id: true, nome: true, email: true, role: true },
      });

      const token = generateToken(usuario);
      res.status(201).json({ usuario, token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('senha').notEmpty().withMessage('Senha é obrigatória'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, senha, fcmToken } = req.body;
    try {
      const usuario = await prisma.usuario.findUnique({ where: { email } });
      if (!usuario) return res.status(401).json({ error: 'Credenciais inválidas' });

      const valid = await bcrypt.compare(senha, usuario.senhaHash);
      if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

      // Atualiza FCM token se fornecido
      if (fcmToken) {
        await prisma.usuario.update({ where: { id: usuario.id }, data: { fcmToken } });
      }

      const token = generateToken(usuario);
      res.json({
        usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
        token,
      });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ usuario: req.user });
});

// POST /api/auth/esqueci-senha
router.post(
  '/esqueci-senha',
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    const { email } = req.body;
    try {
      const usuario = await prisma.usuario.findUnique({ where: { email } });
      // Sempre retorna 200 para não expor se o email existe
      if (!usuario) return res.json({ message: 'Se o e-mail existir, você receberá as instruções.' });

      const token = crypto.randomBytes(32).toString('hex');
      const expiracao = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { tokenRecuperacao: token, tokenExpiracao: expiracao },
      });

      await sendPasswordReset(usuario.email, usuario.nome, token);
      res.json({ message: 'Se o e-mail existir, você receberá as instruções.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
  }
);

// POST /api/auth/redefinir-senha
router.post(
  '/redefinir-senha',
  [
    body('token').notEmpty(),
    body('novaSenha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { token, novaSenha } = req.body;
    try {
      const usuario = await prisma.usuario.findFirst({
        where: {
          tokenRecuperacao: token,
          tokenExpiracao: { gt: new Date() },
        },
      });

      if (!usuario) return res.status(400).json({ error: 'Token inválido ou expirado' });

      const senhaHash = await bcrypt.hash(novaSenha, 12);
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { senhaHash, tokenRecuperacao: null, tokenExpiracao: null },
      });

      res.json({ message: 'Senha redefinida com sucesso' });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
  }
);

// PUT /api/auth/fcm-token
router.put('/fcm-token', authenticate, async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.status(400).json({ error: 'FCM token é obrigatório' });
  await prisma.usuario.update({ where: { id: req.user.id }, data: { fcmToken } });
  res.json({ message: 'Token atualizado' });
});

module.exports = router;
