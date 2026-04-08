const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/materiais?obraId=...
router.get('/', authenticate, async (req, res) => {
  try {
    const { obraId } = req.query;
    const where = {};
    if (obraId) where.obraId = obraId;
    const materiais = await prisma.material.findMany({
      where,
      include: { compras: { orderBy: { data: 'desc' } } },
      orderBy: { nome: 'asc' },
    });
    res.json(materiais);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar materiais' });
  }
});

// POST /api/materiais
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('obraId').notEmpty(),
    body('nome').trim().notEmpty(),
    body('unidade').trim().notEmpty(),
    body('quantSolicitada').isFloat({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { obraId, nome, unidade, quantSolicitada } = req.body;
    try {
      const material = await prisma.material.create({
        data: { obraId, nome, unidade, quantSolicitada: Number(quantSolicitada) },
      });
      res.status(201).json(material);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao criar material' });
    }
  }
);

// PUT /api/materiais/:id
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { nome, unidade, quantSolicitada, quantRecebida, quantUtilizada } = req.body;
  try {
    const material = await prisma.material.update({
      where: { id: req.params.id },
      data: {
        ...(nome && { nome }),
        ...(unidade && { unidade }),
        ...(quantSolicitada !== undefined && { quantSolicitada: Number(quantSolicitada) }),
        ...(quantRecebida !== undefined && { quantRecebida: Number(quantRecebida) }),
        ...(quantUtilizada !== undefined && { quantUtilizada: Number(quantUtilizada) }),
      },
    });
    res.json(material);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Material não encontrado' });
    res.status(500).json({ error: 'Erro ao atualizar material' });
  }
});

// POST /api/materiais/:id/compra — registrar compra
router.post(
  '/:id/compra',
  authenticate,
  requireAdmin,
  [
    body('quantidade').isFloat({ min: 0 }),
    body('valorUnit').isFloat({ min: 0 }),
    body('fornecedor').trim().notEmpty(),
    body('data').isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { quantidade, valorUnit, fornecedor, data, notaFiscal } = req.body;
    const qtd = Number(quantidade);
    const vUnit = Number(valorUnit);
    try {
      const [compra] = await prisma.$transaction([
        prisma.comprasMaterial.create({
          data: {
            materialId: req.params.id,
            quantidade: qtd,
            valorUnit: vUnit,
            valorTotal: qtd * vUnit,
            fornecedor,
            data: new Date(data),
            notaFiscal,
          },
        }),
        prisma.material.update({
          where: { id: req.params.id },
          data: { quantRecebida: { increment: qtd } },
        }),
      ]);
      res.status(201).json(compra);
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Material não encontrado' });
      res.status(500).json({ error: 'Erro ao registrar compra' });
    }
  }
);

// DELETE /api/materiais/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.material.delete({ where: { id: req.params.id } });
    res.json({ message: 'Material removido com sucesso' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Material não encontrado' });
    res.status(500).json({ error: 'Erro ao remover material' });
  }
});

module.exports = router;
