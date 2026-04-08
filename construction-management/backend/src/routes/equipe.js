const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/equipe/profissionais — lista todos profissionais
router.get('/profissionais', authenticate, requireAdmin, async (req, res) => {
  try {
    const profissionais = await prisma.profissional.findMany({
      orderBy: { nome: 'asc' },
      include: {
        obras: {
          where: { dataSaida: null },
          include: { obra: { select: { id: true, nome: true } } },
        },
      },
    });
    res.json(profissionais);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar profissionais' });
  }
});

// POST /api/equipe/profissionais — criar profissional
router.post(
  '/profissionais',
  authenticate,
  requireAdmin,
  [
    body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('funcao').trim().notEmpty().withMessage('Função é obrigatória'),
    body('valorDia').optional().isFloat({ min: 0 }),
    body('valorHora').optional().isFloat({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nome, funcao, telefone, email, cpf, valorDia, valorHora } = req.body;
    try {
      const profissional = await prisma.profissional.create({
        data: {
          nome,
          funcao,
          telefone,
          email,
          cpf,
          valorDia: valorDia ? Number(valorDia) : null,
          valorHora: valorHora ? Number(valorHora) : null,
        },
      });
      res.status(201).json(profissional);
    } catch (err) {
      if (err.code === 'P2002') return res.status(409).json({ error: 'CPF já cadastrado' });
      res.status(500).json({ error: 'Erro ao criar profissional' });
    }
  }
);

// PUT /api/equipe/profissionais/:id
router.put('/profissionais/:id', authenticate, requireAdmin, async (req, res) => {
  const { nome, funcao, telefone, email, cpf, valorDia, valorHora } = req.body;
  try {
    const profissional = await prisma.profissional.update({
      where: { id: req.params.id },
      data: {
        ...(nome && { nome }),
        ...(funcao && { funcao }),
        ...(telefone !== undefined && { telefone }),
        ...(email !== undefined && { email }),
        ...(cpf !== undefined && { cpf }),
        ...(valorDia !== undefined && { valorDia: valorDia ? Number(valorDia) : null }),
        ...(valorHora !== undefined && { valorHora: valorHora ? Number(valorHora) : null }),
      },
    });
    res.json(profissional);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Profissional não encontrado' });
    res.status(500).json({ error: 'Erro ao atualizar profissional' });
  }
});

// POST /api/equipe/alocar — alocar profissional em obra
router.post(
  '/alocar',
  authenticate,
  requireAdmin,
  [
    body('obraId').notEmpty(),
    body('profissionalId').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { obraId, profissionalId } = req.body;
    try {
      const alocacao = await prisma.profissionalObra.create({
        data: { obraId, profissionalId },
        include: { profissional: true, obra: { select: { id: true, nome: true } } },
      });
      res.status(201).json(alocacao);
    } catch (err) {
      if (err.code === 'P2002')
        return res.status(409).json({ error: 'Profissional já alocado nesta obra' });
      res.status(500).json({ error: 'Erro ao alocar profissional' });
    }
  }
);

// PATCH /api/equipe/desalocar/:alocacaoId
router.patch('/desalocar/:alocacaoId', authenticate, requireAdmin, async (req, res) => {
  try {
    const alocacao = await prisma.profissionalObra.update({
      where: { id: req.params.alocacaoId },
      data: { dataSaida: new Date() },
    });
    res.json(alocacao);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Alocação não encontrada' });
    res.status(500).json({ error: 'Erro ao desalocar' });
  }
});

// GET /api/equipe/obra/:obraId — equipe de uma obra
router.get('/obra/:obraId', authenticate, async (req, res) => {
  try {
    const equipe = await prisma.profissionalObra.findMany({
      where: { obraId: req.params.obraId, dataSaida: null },
      include: {
        profissional: true,
        registrosHoras: { orderBy: { data: 'desc' }, take: 5 },
      },
    });
    res.json(equipe);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar equipe' });
  }
});

// POST /api/equipe/horas — registrar horas trabalhadas
router.post(
  '/horas',
  authenticate,
  requireAdmin,
  [
    body('profissionalObraId').notEmpty(),
    body('data').isISO8601(),
    body('horasTrabalhadas').isFloat({ min: 0 }),
    body('valorTotal').isFloat({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { profissionalObraId, data, horasTrabalhadas, valorTotal, observacao } = req.body;
    try {
      const registro = await prisma.registroHoras.create({
        data: {
          profissionalObraId,
          data: new Date(data),
          horasTrabalhadas: Number(horasTrabalhadas),
          valorTotal: Number(valorTotal),
          observacao,
        },
      });
      res.status(201).json(registro);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao registrar horas' });
    }
  }
);

module.exports = router;
