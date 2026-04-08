const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/cliente/obras — obras do cliente logado
router.get('/obras', authenticate, async (req, res) => {
  try {
    const clienteId = req.user.role === 'ADMIN' ? req.query.clienteId : req.user.id;
    if (!clienteId) return res.status(400).json({ error: 'clienteId é obrigatório para admin' });

    const obras = await prisma.obra.findMany({
      where: { clienteId },
      include: {
        etapas: { select: { percentualReal: true } },
        despesas: { select: { valor: true } },
        _count: { select: { diarioEntradas: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const obrasFormatadas = obras.map((obra) => {
      const gastoTotal = obra.despesas.reduce((s, d) => s + d.valor, 0);
      const progressoGeral =
        obra.etapas.length > 0
          ? obra.etapas.reduce((s, e) => s + e.percentualReal, 0) / obra.etapas.length
          : 0;
      return {
        id: obra.id,
        nome: obra.nome,
        endereco: obra.endereco,
        status: obra.status,
        dataInicio: obra.dataInicio,
        dataPrevisaoFim: obra.dataPrevisaoFim,
        orcamentoPrevisto: obra.orcamentoPrevisto,
        gastoTotal,
        progressoGeral: Math.round(progressoGeral),
        totalAtualizacoes: obra._count.diarioEntradas,
      };
    });

    res.json(obrasFormatadas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar obras' });
  }
});

// GET /api/cliente/obras/:obraId/resumo — resumo da obra para o cliente
router.get('/obras/:obraId/resumo', authenticate, async (req, res) => {
  try {
    const obra = await prisma.obra.findUnique({
      where: { id: req.params.obraId },
      include: {
        etapas: { orderBy: { ordem: 'asc' } },
        despesas: { select: { valor: true, categoria: true } },
        orcamentos: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, titulo: true, valor: true, status: true, createdAt: true },
        },
        diarioEntradas: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, titulo: true, descricao: true, fotos: true, createdAt: true },
        },
      },
    });

    if (!obra) return res.status(404).json({ error: 'Obra não encontrada' });
    if (req.user.role === 'CLIENTE' && obra.clienteId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const gastoTotal = obra.despesas.reduce((s, d) => s + d.valor, 0);
    const progressoGeral =
      obra.etapas.length > 0
        ? obra.etapas.reduce((s, e) => s + e.percentualReal, 0) / obra.etapas.length
        : 0;

    res.json({
      obra: {
        id: obra.id,
        nome: obra.nome,
        endereco: obra.endereco,
        status: obra.status,
        dataInicio: obra.dataInicio,
        dataPrevisaoFim: obra.dataPrevisaoFim,
        orcamentoPrevisto: obra.orcamentoPrevisto,
      },
      financeiro: { gastoTotal, saldo: obra.orcamentoPrevisto - gastoTotal },
      progressoGeral: Math.round(progressoGeral),
      etapas: obra.etapas,
      orcamentos: obra.orcamentos,
      ultimasAtualizacoes: obra.diarioEntradas,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar resumo' });
  }
});

// GET /api/cliente/usuarios — lista clientes (admin)
router.get('/usuarios', authenticate, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acesso negado' });
  try {
    const clientes = await prisma.usuario.findMany({
      where: { role: 'CLIENTE' },
      select: { id: true, nome: true, email: true, createdAt: true, _count: { select: { obras: true } } },
      orderBy: { nome: 'asc' },
    });
    res.json(clientes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

module.exports = router;
