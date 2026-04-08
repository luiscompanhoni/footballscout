const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { upload, getFileUrl } = require('../services/upload');
const { notificarUsuario } = require('../services/notifications');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/diario?obraId=...
router.get('/', authenticate, async (req, res) => {
  try {
    const { obraId, page = 1, limit = 20 } = req.query;
    if (!obraId) return res.status(400).json({ error: 'obraId é obrigatório' });

    // Cliente só acessa diário das suas obras
    if (req.user.role === 'CLIENTE') {
      const obra = await prisma.obra.findFirst({
        where: { id: obraId, clienteId: req.user.id },
      });
      if (!obra) return res.status(403).json({ error: 'Acesso negado' });
    }

    const [entradas, total] = await Promise.all([
      prisma.diarioEntrada.findMany({
        where: { obraId },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.diarioEntrada.count({ where: { obraId } }),
    ]);

    res.json({ entradas, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar diário' });
  }
});

// GET /api/diario/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const entrada = await prisma.diarioEntrada.findUnique({
      where: { id: req.params.id },
      include: { obra: { select: { id: true, nome: true, clienteId: true } } },
    });
    if (!entrada) return res.status(404).json({ error: 'Entrada não encontrada' });
    if (req.user.role === 'CLIENTE' && entrada.obra.clienteId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    res.json(entrada);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar entrada' });
  }
});

// POST /api/diario — criar entrada com upload de fotos
router.post(
  '/',
  authenticate,
  requireAdmin,
  upload.array('fotos', 10),
  async (req, res) => {
    const { obraId, titulo, descricao } = req.body;
    if (!obraId || !titulo || !descricao) {
      return res.status(400).json({ error: 'obraId, titulo e descricao são obrigatórios' });
    }

    try {
      const fotos = req.files ? req.files.map(getFileUrl) : [];

      const obra = await prisma.obra.findUnique({
        where: { id: obraId },
        select: { nome: true, clienteId: true },
      });
      if (!obra) return res.status(404).json({ error: 'Obra não encontrada' });

      const entrada = await prisma.diarioEntrada.create({
        data: { obraId, titulo, descricao, fotos },
      });

      // Notifica cliente
      await notificarUsuario({
        usuarioId: obra.clienteId,
        titulo: `Nova atualização na obra: ${obra.nome}`,
        mensagem: titulo,
        obraId,
        tipo: 'DIARIO_ATUALIZACAO',
      });

      res.status(201).json(entrada);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao criar entrada no diário' });
    }
  }
);

// PUT /api/diario/:id
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  upload.array('fotos', 10),
  async (req, res) => {
    const { titulo, descricao, fotosExistentes } = req.body;
    try {
      const novasFotos = req.files ? req.files.map(getFileUrl) : [];
      const fotosAnteriores = fotosExistentes
        ? JSON.parse(fotosExistentes)
        : [];

      const entrada = await prisma.diarioEntrada.update({
        where: { id: req.params.id },
        data: {
          ...(titulo && { titulo }),
          ...(descricao && { descricao }),
          fotos: [...fotosAnteriores, ...novasFotos],
        },
      });
      res.json(entrada);
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Entrada não encontrada' });
      res.status(500).json({ error: 'Erro ao atualizar entrada' });
    }
  }
);

// DELETE /api/diario/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.diarioEntrada.delete({ where: { id: req.params.id } });
    res.json({ message: 'Entrada removida com sucesso' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Entrada não encontrada' });
    res.status(500).json({ error: 'Erro ao remover entrada' });
  }
});

module.exports = router;
