const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/notificacoes — lista notificações do usuário
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, naoLidas } = req.query;
    const where = { usuarioId: req.user.id };
    if (naoLidas === 'true') where.lida = false;

    const [notificacoes, total, naoLidasCount] = await Promise.all([
      prisma.notificacao.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.notificacao.count({ where }),
      prisma.notificacao.count({ where: { usuarioId: req.user.id, lida: false } }),
    ]);

    res.json({ notificacoes, total, naoLidasCount, page: Number(page) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// PATCH /api/notificacoes/:id/ler — marcar como lida
router.patch('/:id/ler', authenticate, async (req, res) => {
  try {
    const notificacao = await prisma.notificacao.updateMany({
      where: { id: req.params.id, usuarioId: req.user.id },
      data: { lida: true },
    });
    if (notificacao.count === 0) return res.status(404).json({ error: 'Notificação não encontrada' });
    res.json({ message: 'Marcada como lida' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar notificação' });
  }
});

// PATCH /api/notificacoes/ler-todas — marcar todas como lidas
router.patch('/ler-todas', authenticate, async (req, res) => {
  try {
    await prisma.notificacao.updateMany({
      where: { usuarioId: req.user.id, lida: false },
      data: { lida: true },
    });
    res.json({ message: 'Todas marcadas como lidas' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar notificações' });
  }
});

module.exports = router;
