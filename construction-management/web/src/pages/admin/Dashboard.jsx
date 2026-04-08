import { useQuery } from '@tanstack/react-query';
import { obrasAPI, relatoriosAPI } from '../../services/api.js';
import { Building2, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

const StatusBadge = ({ status }) => {
  const map = {
    PLANEJAMENTO: 'badge-cinza',
    EM_ANDAMENTO: 'badge-azul',
    PARALISADA: 'badge-amarelo',
    CONCLUIDA: 'badge-verde',
  };
  const label = { PLANEJAMENTO: 'Planejamento', EM_ANDAMENTO: 'Em andamento', PARALISADA: 'Paralisada', CONCLUIDA: 'Concluída' };
  return <span className={map[status] || 'badge-cinza'}>{label[status] || status}</span>;
};

export default function AdminDashboard() {
  const { data: resumo, isLoading: loadingResumo } = useQuery({
    queryKey: ['dashboard-resumo'],
    queryFn: () => obrasAPI.dashboard().then((r) => r.data),
  });

  const { data: financeiro } = useQuery({
    queryKey: ['financeiro', new Date().getFullYear()],
    queryFn: () => relatoriosAPI.financeiro(new Date().getFullYear()).then((r) => r.data),
  });

  const { data: obrasData } = useQuery({
    queryKey: ['obras', { page: 1, limit: 5 }],
    queryFn: () => obrasAPI.listar({ page: 1, limit: 5 }).then((r) => r.data),
  });

  const chartData = financeiro?.evolucaoMensal?.map((m) => ({
    mes: MESES[m.mes - 1],
    'Mão de Obra': m.maoDeObra,
    Materiais: m.materiais,
    Equipamentos: m.equipamentos,
    Outros: m.outros,
  })) || [];

  const stats = [
    {
      label: 'Total de Obras',
      value: resumo?.totalObras || 0,
      icon: Building2,
      color: 'bg-blue-500',
      sub: `${resumo?.statusCounts?.EM_ANDAMENTO || 0} em andamento`,
    },
    {
      label: 'Orçamento Total',
      value: formatCurrency(resumo?.orcamentoTotal),
      icon: DollarSign,
      color: 'bg-green-500',
      sub: 'previsto',
    },
    {
      label: 'Gasto Realizado',
      value: formatCurrency(resumo?.gastoTotal),
      icon: TrendingUp,
      color: 'bg-orange-500',
      sub: `${resumo?.orcamentoTotal > 0 ? ((resumo.gastoTotal / resumo.orcamentoTotal) * 100).toFixed(0) : 0}% do orçamento`,
    },
    {
      label: 'Obras Paralisadas',
      value: resumo?.statusCounts?.PARALISADA || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      sub: 'atenção necessária',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral de todas as obras</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`${color} p-3 rounded-xl`}>
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Evolução de Gastos — {new Date().getFullYear()}</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Legend />
            <Bar dataKey="Mão de Obra" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Materiais" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Equipamentos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Outros" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Obras recentes */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Obras Recentes</h2>
        {loadingResumo ? (
          <p className="text-gray-400 text-sm">Carregando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Obra</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Cliente</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Progresso</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Orçamento</th>
                </tr>
              </thead>
              <tbody>
                {obrasData?.obras?.map((obra) => (
                  <tr key={obra.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 font-medium text-gray-900">{obra.nome}</td>
                    <td className="py-2.5 text-gray-500">{obra.cliente?.nome}</td>
                    <td className="py-2.5"><StatusBadge status={obra.status} /></td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-primary-600 h-1.5 rounded-full"
                            style={{ width: `${obra.progressoGeral}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{obra.progressoGeral}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-gray-900">{formatCurrency(obra.orcamentoPrevisto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
