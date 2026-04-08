const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/obras — lista todas as obras (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, clienteId, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (clienteId) where.clienteId = clienteId;

    const [obras, total] = await Promise.all([
      prisma.obra.findMany({
        where,
        include: {
          cliente: { select: { id: true, nome: true, email: true } },
          etapas: { select: { percentualReal: true } },
          despesas: { select: { valor: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.obra.count({ where }),
    ]);

    const obrasComProgresso = obras.map((obra) => {
      const gastoTotal = obra.despesas.reduce((sum, d) => sum + d.valor, 0);
      const progressoMedio =
        obra.etapas.length > 0
          ? obra.etapas.reduce((sum, e) => sum + e.percentualReal, 0) / obra.etapas.length
          : 0;
      return {
        ...obra,
        gastoTotal,
        progressoGeral: Math.round(progressoMedio),
        despesas: undefined,
        etapas: undefined,
      };
    });

    res.json({ obras: obrasComProgresso, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar obras' });
  }
});

// GET /api/obras/:id — detalhes de uma obra
router.get('/:id', authenticate, async (req, res) => {
  try {
    const obra = await prisma.obra.findUnique({
      where: { id: req.params.id },
      include: {
        cliente: { select: { id: true, nome: true, email: true } },
        etapas: { orderBy: { ordem: 'asc' } },
        orcamentos: { orderBy: { createdAt: 'desc' } },
        despesas: { orderBy: { data: 'desc' } },
        profissionaisObra: {
          include: { profissional: true },
          where: { dataSaida: null },
        },
        materiais: true,
        diarioEntradas: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!obra) return res.status(404).json({ error: 'Obra não encontrada' });

    // Cliente só acessa suas próprias obras
    if (req.user.role === 'CLIENTE' && obra.clienteId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const gastoTotal = obra.despesas.reduce((sum, d) => sum + d.valor, 0);
    const progressoGeral =
      obra.etapas.length > 0
        ? obra.etapas.reduce((sum, e) => sum + e.percentualReal, 0) / obra.etapas.length
        : 0;

    res.json({ ...obra, gastoTotal, progressoGeral: Math.round(progressoGeral) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar obra' });
  }
});

// POST /api/obras — criar obra (admin)
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('endereco').trim().notEmpty().withMessage('Endereço é obrigatório'),
    body('clienteId').notEmpty().withMessage('Cliente é obrigatório'),
    body('dataInicio').isISO8601().withMessage('Data de início inválida'),
    body('dataPrevisaoFim').isISO8601().withMessage('Data de previsão inválida'),
    body('orcamentoPrevisto').isFloat({ min: 0 }).withMessage('Orçamento inválido'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nome, endereco, descricao, clienteId, dataInicio, dataPrevisaoFim, orcamentoPrevisto } =
      req.body;
    try {
      const obra = await prisma.obra.create({
        data: {
          nome,
          endereco,
          descricao,
          clienteId,
          dataInicio: new Date(dataInicio),
          dataPrevisaoFim: new Date(dataPrevisaoFim),
          orcamentoPrevisto: Number(orcamentoPrevisto),
        },
        include: { cliente: { select: { id: true, nome: true, email: true } } },
      });
      res.status(201).json(obra);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao criar obra' });
    }
  }
);

// PUT /api/obras/:id — atualizar obra (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { nome, endereco, descricao, status, dataInicio, dataPrevisaoFim, dataFimReal, orcamentoPrevisto } =
    req.body;
  try {
    const obra = await prisma.obra.update({
      where: { id: req.params.id },
      data: {
        ...(nome && { nome }),
        ...(endereco && { endereco }),
        ...(descricao !== undefined && { descricao }),
        ...(status && { status }),
        ...(dataInicio && { dataInicio: new Date(dataInicio) }),
        ...(dataPrevisaoFim && { dataPrevisaoFim: new Date(dataPrevisaoFim) }),
        ...(dataFimReal && { dataFimReal: new Date(dataFimReal) }),
        ...(orcamentoPrevisto !== undefined && { orcamentoPrevisto: Number(orcamentoPrevisto) }),
      },
    });
    res.json(obra);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Obra não encontrada' });
    res.status(500).json({ error: 'Erro ao atualizar obra' });
  }
});

// DELETE /api/obras/:id — remover obra (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.obra.delete({ where: { id: req.params.id } });
    res.json({ message: 'Obra removida com sucesso' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Obra não encontrada' });
    res.status(500).json({ error: 'Erro ao remover obra' });
  }
});

// GET /api/obras/dashboard/resumo — resumo para o dashboard admin
router.get('/dashboard/resumo', authenticate, requireAdmin, async (req, res) => {
  try {
    const [totalObras, statusCounts, orcamentos, despesas] = await Promise.all([
      prisma.obra.count(),
      prisma.obra.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.obra.aggregate({ _sum: { orcamentoPrevisto: true } }),
      prisma.despesa.aggregate({ _sum: { valor: true } }),
    ]);

    res.json({
      totalObras,
      statusCounts: statusCounts.reduce((acc, s) => {
        acc[s.status] = s._count.id;
        return acc;
      }, {}),
      orcamentoTotal: orcamentos._sum.orcamentoPrevisto || 0,
      gastoTotal: despesas._sum.valor || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar resumo' });
  }
});

module.exports = router;
