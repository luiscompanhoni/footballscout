const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/etapas?obraId=...
router.get('/', authenticate, async (req, res) => {
  try {
    const { obraId } = req.query;
    if (!obraId) return res.status(400).json({ error: 'obraId é obrigatório' });
    const etapas = await prisma.etapa.findMany({
      where: { obraId },
      orderBy: { ordem: 'asc' },
    });
    res.json(etapas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar etapas' });
  }
});

// POST /api/etapas
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('obraId').notEmpty(),
    body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('ordem').isInt({ min: 1 }),
    body('percentualPrev').isFloat({ min: 0, max: 100 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { obraId, nome, descricao, ordem, percentualPrev, dataInicio, dataFim } = req.body;
    try {
      const etapa = await prisma.etapa.create({
        data: {
          obraId,
          nome,
          descricao,
          ordem: Number(ordem),
          percentualPrev: Number(percentualPrev),
          ...(dataInicio && { dataInicio: new Date(dataInicio) }),
          ...(dataFim && { dataFim: new Date(dataFim) }),
        },
      });
      res.status(201).json(etapa);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao criar etapa' });
    }
  }
);

// PUT /api/etapas/:id
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { nome, descricao, ordem, percentualPrev, percentualReal, dataInicio, dataFim } = req.body;
  try {
    const etapa = await prisma.etapa.update({
      where: { id: req.params.id },
      data: {
        ...(nome && { nome }),
        ...(descricao !== undefined && { descricao }),
        ...(ordem !== undefined && { ordem: Number(ordem) }),
        ...(percentualPrev !== undefined && { percentualPrev: Number(percentualPrev) }),
        ...(percentualReal !== undefined && { percentualReal: Math.min(100, Math.max(0, Number(percentualReal))) }),
        ...(dataInicio && { dataInicio: new Date(dataInicio) }),
        ...(dataFim && { dataFim: new Date(dataFim) }),
      },
    });
    res.json(etapa);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Etapa não encontrada' });
    res.status(500).json({ error: 'Erro ao atualizar etapa' });
  }
});

// PATCH /api/etapas/:id/progresso — atualiza apenas o percentual
router.patch('/:id/progresso', authenticate, requireAdmin, async (req, res) => {
  const { percentualReal } = req.body;
  if (percentualReal === undefined)
    return res.status(400).json({ error: 'percentualReal é obrigatório' });
  try {
    const etapa = await prisma.etapa.update({
      where: { id: req.params.id },
      data: { percentualReal: Math.min(100, Math.max(0, Number(percentualReal))) },
    });
    res.json(etapa);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Etapa não encontrada' });
    res.status(500).json({ error: 'Erro ao atualizar progresso' });
  }
});

// DELETE /api/etapas/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.etapa.delete({ where: { id: req.params.id } });
    res.json({ message: 'Etapa removida com sucesso' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Etapa não encontrada' });
    res.status(500).json({ error: 'Erro ao remover etapa' });
  }
});

module.exports = router;
