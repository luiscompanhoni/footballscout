const express = require('express');
const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const formatCurrency = (v) =>
  `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—';

// GET /api/relatorios/obra/:obraId — relatório resumido por obra (JSON)
router.get('/obra/:obraId', authenticate, async (req, res) => {
  try {
    const obra = await prisma.obra.findUnique({
      where: { id: req.params.obraId },
      include: {
        cliente: { select: { nome: true, email: true } },
        etapas: { orderBy: { ordem: 'asc' } },
        despesas: true,
        profissionaisObra: { include: { profissional: true, registrosHoras: true } },
        materiais: { include: { compras: true } },
      },
    });

    if (!obra) return res.status(404).json({ error: 'Obra não encontrada' });
    if (req.user.role === 'CLIENTE' && obra.clienteId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const gastoTotal = obra.despesas.reduce((s, d) => s + d.valor, 0);
    const gastoCategoria = obra.despesas.reduce((acc, d) => {
      acc[d.categoria] = (acc[d.categoria] || 0) + d.valor;
      return acc;
    }, {});

    const progressoGeral =
      obra.etapas.length > 0
        ? obra.etapas.reduce((s, e) => s + e.percentualReal, 0) / obra.etapas.length
        : 0;

    const gastoEquipe = obra.profissionaisObra.reduce(
      (s, po) => s + po.registrosHoras.reduce((sh, h) => sh + h.valorTotal, 0),
      0
    );

    res.json({
      obra: {
        id: obra.id,
        nome: obra.nome,
        endereco: obra.endereco,
        status: obra.status,
        dataInicio: obra.dataInicio,
        dataPrevisaoFim: obra.dataPrevisaoFim,
        cliente: obra.cliente,
      },
      financeiro: {
        orcamentoPrevisto: obra.orcamentoPrevisto,
        gastoTotal,
        saldo: obra.orcamentoPrevisto - gastoTotal,
        percentualGasto: obra.orcamentoPrevisto > 0
          ? ((gastoTotal / obra.orcamentoPrevisto) * 100).toFixed(1)
          : '0',
        gastoCategoria,
        gastoEquipe,
      },
      progresso: {
        geral: Math.round(progressoGeral),
        etapas: obra.etapas.map((e) => ({
          nome: e.nome,
          ordem: e.ordem,
          percentualPrev: e.percentualPrev,
          percentualReal: e.percentualReal,
          dataInicio: e.dataInicio,
          dataFim: e.dataFim,
        })),
      },
      equipe: obra.profissionaisObra.map((po) => ({
        nome: po.profissional.nome,
        funcao: po.profissional.funcao,
        totalHoras: po.registrosHoras.reduce((s, h) => s + h.horasTrabalhadas, 0),
        totalPago: po.registrosHoras.reduce((s, h) => s + h.valorTotal, 0),
      })),
      materiais: obra.materiais.map((m) => ({
        nome: m.nome,
        unidade: m.unidade,
        quantSolicitada: m.quantSolicitada,
        quantRecebida: m.quantRecebida,
        quantUtilizada: m.quantUtilizada,
        totalGasto: m.compras.reduce((s, c) => s + c.valorTotal, 0),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

// GET /api/relatorios/obra/:obraId/pdf — exportar PDF
router.get('/obra/:obraId/pdf', authenticate, async (req, res) => {
  try {
    const obra = await prisma.obra.findUnique({
      where: { id: req.params.obraId },
      include: {
        cliente: { select: { nome: true, email: true } },
        etapas: { orderBy: { ordem: 'asc' } },
        despesas: true,
        materiais: true,
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

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-${obra.nome.replace(/\s+/g, '_')}.pdf"`);
    doc.pipe(res);

    // Cabeçalho
    doc.fontSize(20).font('Helvetica-Bold').text('GerObras — Relatório de Obra', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').text(obra.nome, { align: 'center' });
    doc.moveDown();

    // Informações gerais
    doc.fontSize(12).font('Helvetica-Bold').text('INFORMAÇÕES GERAIS');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Endereço: ${obra.endereco}`);
    doc.text(`Cliente: ${obra.cliente.nome}`);
    doc.text(`Status: ${obra.status}`);
    doc.text(`Início: ${formatDate(obra.dataInicio)}   Previsão: ${formatDate(obra.dataPrevisaoFim)}`);
    doc.moveDown();

    // Financeiro
    doc.fontSize(12).font('Helvetica-Bold').text('FINANCEIRO');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Orçamento previsto: ${formatCurrency(obra.orcamentoPrevisto)}`);
    doc.text(`Gasto realizado: ${formatCurrency(gastoTotal)}`);
    doc.text(`Saldo: ${formatCurrency(obra.orcamentoPrevisto - gastoTotal)}`);
    doc.text(
      `Percentual gasto: ${obra.orcamentoPrevisto > 0 ? ((gastoTotal / obra.orcamentoPrevisto) * 100).toFixed(1) : 0}%`
    );
    doc.moveDown();

    // Etapas
    doc.fontSize(12).font('Helvetica-Bold').text('PROGRESSO — ETAPAS');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Progresso geral: ${Math.round(progressoGeral)}%`);
    doc.moveDown(0.3);
    obra.etapas.forEach((e) => {
      doc.text(`${e.ordem}. ${e.nome}  —  Previsto: ${e.percentualPrev}%  |  Realizado: ${e.percentualReal}%`);
    });
    doc.moveDown();

    // Materiais
    doc.fontSize(12).font('Helvetica-Bold').text('MATERIAIS');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10);
    obra.materiais.forEach((m) => {
      doc.text(
        `${m.nome} (${m.unidade})  —  Solicitado: ${m.quantSolicitada}  |  Recebido: ${m.quantRecebida}  |  Utilizado: ${m.quantUtilizada}`
      );
    });

    doc.moveDown(2);
    doc.fontSize(8).fillColor('gray').text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, { align: 'right' });
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
});

// GET /api/relatorios/obra/:obraId/excel — exportar Excel
router.get('/obra/:obraId/excel', authenticate, async (req, res) => {
  try {
    const obra = await prisma.obra.findUnique({
      where: { id: req.params.obraId },
      include: {
        cliente: { select: { nome: true } },
        etapas: { orderBy: { ordem: 'asc' } },
        despesas: { orderBy: { data: 'asc' } },
        materiais: { include: { compras: true } },
        profissionaisObra: { include: { profissional: true, registrosHoras: true } },
      },
    });
    if (!obra) return res.status(404).json({ error: 'Obra não encontrada' });
    if (req.user.role === 'CLIENTE' && obra.clienteId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GerObras';

    // Aba Resumo
    const wsResumo = workbook.addWorksheet('Resumo');
    wsResumo.addRow(['GerObras — Relatório de Obra']);
    wsResumo.addRow([obra.nome]);
    wsResumo.addRow([]);
    wsResumo.addRow(['Campo', 'Valor']);
    wsResumo.addRow(['Endereço', obra.endereco]);
    wsResumo.addRow(['Cliente', obra.cliente.nome]);
    wsResumo.addRow(['Status', obra.status]);
    wsResumo.addRow(['Início', formatDate(obra.dataInicio)]);
    wsResumo.addRow(['Previsão término', formatDate(obra.dataPrevisaoFim)]);
    wsResumo.addRow(['Orçamento previsto', obra.orcamentoPrevisto]);
    const gastoTotal = obra.despesas.reduce((s, d) => s + d.valor, 0);
    wsResumo.addRow(['Gasto realizado', gastoTotal]);

    // Aba Despesas
    const wsDespesas = workbook.addWorksheet('Despesas');
    wsDespesas.addRow(['Descrição', 'Categoria', 'Valor (R$)', 'Data', 'Fornecedor']);
    obra.despesas.forEach((d) => {
      wsDespesas.addRow([d.descricao, d.categoria, d.valor, formatDate(d.data), d.fornecedor || '']);
    });

    // Aba Etapas
    const wsEtapas = workbook.addWorksheet('Etapas');
    wsEtapas.addRow(['Ordem', 'Nome', '% Previsto', '% Realizado', 'Início', 'Fim']);
    obra.etapas.forEach((e) => {
      wsEtapas.addRow([e.ordem, e.nome, e.percentualPrev, e.percentualReal, formatDate(e.dataInicio), formatDate(e.dataFim)]);
    });

    // Aba Materiais
    const wsMateriais = workbook.addWorksheet('Materiais');
    wsMateriais.addRow(['Nome', 'Unidade', 'Solicitado', 'Recebido', 'Utilizado', 'Total Gasto (R$)']);
    obra.materiais.forEach((m) => {
      const totalGasto = m.compras.reduce((s, c) => s + c.valorTotal, 0);
      wsMateriais.addRow([m.nome, m.unidade, m.quantSolicitada, m.quantRecebida, m.quantUtilizada, totalGasto]);
    });

    // Aba Equipe
    const wsEquipe = workbook.addWorksheet('Equipe');
    wsEquipe.addRow(['Profissional', 'Função', 'Total Horas', 'Total Pago (R$)']);
    obra.profissionaisObra.forEach((po) => {
      const totalHoras = po.registrosHoras.reduce((s, h) => s + h.horasTrabalhadas, 0);
      const totalPago = po.registrosHoras.reduce((s, h) => s + h.valorTotal, 0);
      wsEquipe.addRow([po.profissional.nome, po.profissional.funcao, totalHoras, totalPago]);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-${obra.nome.replace(/\s+/g, '_')}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar Excel' });
  }
});

// GET /api/relatorios/financeiro — relatório financeiro geral (admin)
router.get('/financeiro', authenticate, requireAdmin, async (req, res) => {
  try {
    const { ano } = req.query;
    const anoFiltro = ano ? Number(ano) : new Date().getFullYear();

    const despesas = await prisma.despesa.findMany({
      where: {
        data: {
          gte: new Date(`${anoFiltro}-01-01`),
          lte: new Date(`${anoFiltro}-12-31`),
        },
      },
      include: { obra: { select: { nome: true } } },
    });

    // Evolução mensal
    const mensal = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      gastoTotal: 0,
      maoDeObra: 0,
      materiais: 0,
      equipamentos: 0,
      outros: 0,
    }));

    despesas.forEach((d) => {
      const mes = new Date(d.data).getMonth();
      mensal[mes].gastoTotal += d.valor;
      if (d.categoria === 'MAO_DE_OBRA') mensal[mes].maoDeObra += d.valor;
      if (d.categoria === 'MATERIAIS') mensal[mes].materiais += d.valor;
      if (d.categoria === 'EQUIPAMENTOS') mensal[mes].equipamentos += d.valor;
      if (d.categoria === 'OUTROS') mensal[mes].outros += d.valor;
    });

    const totalGeral = despesas.reduce((s, d) => s + d.valor, 0);
    const obras = await prisma.obra.aggregate({ _sum: { orcamentoPrevisto: true } });

    res.json({
      ano: anoFiltro,
      totalOrcamentoPrevisto: obras._sum.orcamentoPrevisto || 0,
      totalGasto: totalGeral,
      evolucaoMensal: mensal,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar relatório financeiro' });
  }
});

module.exports = router;
