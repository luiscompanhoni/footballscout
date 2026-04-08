const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { notificarUsuario, notificarTodosAdmins } = require('../services/notifications');
const { sendOrcamentoNotificacao } = require('../services/email');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/orcamentos?obraId=...
router.get('/', authenticate, async (req, res) => {
  try {
    const { obraId } = req.query;
    const where = {};
    if (obraId) where.obraId = obraId;

    // Cliente só acessa orçamentos das suas obras
    if (req.user.role === 'CLIENTE') {
      where.obra = { clienteId: req.user.id };
    }

    const orcamentos = await prisma.orcamento.findMany({
      where,
      include: {
        itens: true,
        obra: { select: { id: true, nome: true, clienteId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orcamentos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar orçamentos' });
  }
});

// GET /api/orcamentos/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const orcamento = await prisma.orcamento.findUnique({
      where: { id: req.params.id },
      include: { itens: true, obra: { select: { id: true, nome: true, clienteId: true } } },
    });
    if (!orcamento) return res.status(404).json({ error: 'Orçamento não encontrado' });
    if (req.user.role === 'CLIENTE' && orcamento.obra.clienteId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    res.json(orcamento);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar orçamento' });
  }
});

// POST /api/orcamentos — criar orçamento (admin)
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('obraId').notEmpty(),
    body('titulo').trim().notEmpty().withMessage('Título é obrigatório'),
    body('valor').isFloat({ min: 0 }),
    body('itens').optional().isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { obraId, titulo, descricao, valor, itens = [] } = req.body;
    try {
      const obra = await prisma.obra.findUnique({
        where: { id: obraId },
        select: { nome: true, clienteId: true },
      });
      if (!obra) return res.status(404).json({ error: 'Obra não encontrada' });

      const orcamento = await prisma.orcamento.create({
        data: {
          obraId,
          titulo,
          descricao,
          valor: Number(valor),
          itens: {
            create: itens.map((item) => ({
              descricao: item.descricao,
              quantidade: Number(item.quantidade),
              valorUnit: Number(item.valorUnit),
            })),
          },
        },
        include: { itens: true },
      });

      // Notifica o cliente
      await notificarUsuario({
        usuarioId: obra.clienteId,
        titulo: 'Novo orçamento aguardando aprovação',
        mensagem: `A obra "${obra.nome}" tem um novo orçamento: ${titulo}`,
        obraId,
        tipo: 'ORCAMENTO_PENDENTE',
      });

      res.status(201).json(orcamento);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao criar orçamento' });
    }
  }
);

// PATCH /api/orcamentos/:id/aprovar — cliente aprova ou reprova
router.patch('/:id/aprovar', authenticate, async (req, res) => {
  const { status, justificativa } = req.body;
  if (!['APROVADO', 'REPROVADO'].includes(status)) {
    return res.status(400).json({ error: 'Status deve ser APROVADO ou REPROVADO' });
  }

  try {
    const orcamento = await prisma.orcamento.findUnique({
      where: { id: req.params.id },
      include: { obra: { select: { nome: true, clienteId: true } } },
    });

    if (!orcamento) return res.status(404).json({ error: 'Orçamento não encontrado' });

    // Apenas o cliente da obra ou admin pode aprovar
    if (req.user.role === 'CLIENTE' && orcamento.obra.clienteId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (orcamento.status !== 'PENDENTE') {
      return res.status(409).json({ error: 'Orçamento já foi avaliado' });
    }

    const atualizado = await prisma.orcamento.update({
      where: { id: req.params.id },
      data: { status, justificativa: justificativa || null },
    });

    // Notifica admins
    await notificarTodosAdmins({
      titulo: `Orçamento ${status === 'APROVADO' ? 'aprovado' : 'reprovado'}`,
      mensagem: `O orçamento "${orcamento.titulo}" da obra "${orcamento.obra.nome}" foi ${status === 'APROVADO' ? 'aprovado' : 'reprovado'}.`,
      obraId: orcamento.obraId,
      tipo: `ORCAMENTO_${status}`,
    });

    res.json(atualizado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar orçamento' });
  }
});

// POST /api/orcamentos/despesa — lançar despesa (admin)
router.post(
  '/despesa',
  authenticate,
  requireAdmin,
  [
    body('obraId').notEmpty(),
    body('descricao').trim().notEmpty(),
    body('categoria').isIn(['MAO_DE_OBRA', 'MATERIAIS', 'EQUIPAMENTOS', 'OUTROS']),
    body('valor').isFloat({ min: 0 }),
    body('data').isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { obraId, descricao, categoria, valor, data, fornecedor, notaFiscal } = req.body;
    try {
      const despesa = await prisma.despesa.create({
        data: {
          obraId,
          descricao,
          categoria,
          valor: Number(valor),
          data: new Date(data),
          fornecedor,
          notaFiscal,
        },
      });

      // Verifica alertas de orçamento
      const obra = await prisma.obra.findUnique({
        where: { id: obraId },
        select: { orcamentoPrevisto: true, nome: true, clienteId: true },
      });
      const gastoTotal = await prisma.despesa.aggregate({
        where: { obraId },
        _sum: { valor: true },
      });

      const gasto = gastoTotal._sum.valor || 0;
      const percentual = obra.orcamentoPrevisto > 0
        ? (gasto / obra.orcamentoPrevisto) * 100
        : 0;

      const alertaWarn = Number(process.env.ALERT_PERCENTAGE_WARN || 80);
      const alertaCritical = Number(process.env.ALERT_PERCENTAGE_CRITICAL || 100);

      if (percentual >= alertaCritical) {
        await notificarTodosAdmins({
          titulo: `⚠️ Orçamento estourado — ${obra.nome}`,
          mensagem: `O gasto (${percentual.toFixed(0)}%) ultrapassou o orçamento previsto!`,
          obraId,
          tipo: 'ALERTA_ORCAMENTO_CRITICO',
        });
      } else if (percentual >= alertaWarn) {
        await notificarTodosAdmins({
          titulo: `⚠️ Alerta de orçamento — ${obra.nome}`,
          mensagem: `O gasto atingiu ${percentual.toFixed(0)}% do orçamento previsto.`,
          obraId,
          tipo: 'ALERTA_ORCAMENTO',
        });
      }

      res.status(201).json(despesa);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao lançar despesa' });
    }
  }
);

// GET /api/orcamentos/despesas?obraId=...
router.get('/despesas/lista', authenticate, async (req, res) => {
  try {
    const { obraId } = req.query;
    const where = {};
    if (obraId) where.obraId = obraId;
    const despesas = await prisma.despesa.findMany({
      where,
      orderBy: { data: 'desc' },
    });
    res.json(despesas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar despesas' });
  }
});

module.exports = router;
