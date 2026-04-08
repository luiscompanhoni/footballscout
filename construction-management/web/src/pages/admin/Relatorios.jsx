import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { relatoriosAPI, obrasAPI } from '../../services/api.js';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const CORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};

export default function AdminRelatorios() {
  const [obraId, setObraId] = useState('');
  const [ano, setAno] = useState(new Date().getFullYear());

  const { data: obras } = useQuery({ queryKey: ['obras'], queryFn: () => obrasAPI.listar().then(r => r.data) });
  const { data: relatorio } = useQuery({
    queryKey: ['relatorio-obra', obraId],
    queryFn: () => relatoriosAPI.obra(obraId).then(r => r.data),
    enabled: !!obraId,
  });
  const { data: financeiro } = useQuery({
    queryKey: ['financeiro', ano],
    queryFn: () => relatoriosAPI.financeiro(ano).then(r => r.data),
  });

  const handlePDF = async () => {
    if (!obraId) { toast.error('Selecione uma obra'); return; }
    try {
      const res = await relatoriosAPI.obraPDF(obraId);
      downloadBlob(new Blob([res.data], { type: 'application/pdf' }), `relatorio.pdf`);
    } catch { toast.error('Erro ao gerar PDF'); }
  };

  const handleExcel = async () => {
    if (!obraId) { toast.error('Selecione uma obra'); return; }
    try {
      const res = await relatoriosAPI.obraExcel(obraId);
      downloadBlob(
        new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `relatorio.xlsx`
      );
    } catch { toast.error('Erro ao gerar Excel'); }
  };

  const chartMensal = financeiro?.evolucaoMensal?.map(m => ({
    mes: MESES[m.mes - 1],
    'Mão de Obra': m.maoDeObra,
    Materiais: m.materiais,
    Equipamentos: m.equipamentos,
    Outros: m.outros,
  })) || [];

  const categoriaData = relatorio ? Object.entries(relatorio.financeiro?.gastoCategoria || {}).map(([k, v]) => ({
    name: { MAO_DE_OBRA: 'Mão de Obra', MATERIAIS: 'Materiais', EQUIPAMENTOS: 'Equipamentos', OUTROS: 'Outros' }[k],
    value: v,
  })) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>

      {/* Relatório por obra */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">Relatório por Obra</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <select className="input flex-1" value={obraId} onChange={e => setObraId(e.target.value)}>
            <option value="">Selecione uma obra</option>
            {obras?.obras?.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
          <button onClick={handlePDF} className="btn-secondary flex items-center justify-center gap-2">
            <Download size={16} /> PDF
          </button>
          <button onClick={handleExcel} className="btn-secondary flex items-center justify-center gap-2">
            <FileSpreadsheet size={16} /> Excel
          </button>
        </div>

        {relatorio && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Previsto', value: formatCurrency(relatorio.financeiro?.orcamentoPrevisto) },
                { label: 'Realizado', value: formatCurrency(relatorio.financeiro?.gastoTotal) },
                { label: 'Saldo', value: formatCurrency(relatorio.financeiro?.saldo) },
                { label: 'Progresso', value: `${relatorio.progresso?.geral}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            {categoriaData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Gastos por Categoria</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={categoriaData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {categoriaData.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Etapas</h3>
                  <div className="space-y-2">
                    {relatorio.progresso?.etapas?.map(e => (
                      <div key={e.nome}>
                        <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                          <span>{e.ordem}. {e.nome}</span>
                          <span>{e.percentualReal}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${e.percentualReal}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Relatório financeiro anual */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Relatório Financeiro Anual</h2>
          <select className="input w-28" value={ano} onChange={e => setAno(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {financeiro && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Orçamento Total</p>
                <p className="text-lg font-bold">{formatCurrency(financeiro.totalOrcamentoPrevisto)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Gasto Total</p>
                <p className="text-lg font-bold">{formatCurrency(financeiro.totalGasto)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">% Gasto</p>
                <p className="text-lg font-bold">
                  {financeiro.totalOrcamentoPrevisto > 0
                    ? ((financeiro.totalGasto / financeiro.totalOrcamentoPrevisto) * 100).toFixed(0)
                    : 0}%
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="Mão de Obra" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="Materiais" fill="#10b981" radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="Equipamentos" fill="#f59e0b" radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="Outros" fill="#8b5cf6" radius={[0, 0, 4, 4]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
