import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { clienteAPI } from '../../services/api.js';
import { Building2, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

const STATUS_LABEL = { PLANEJAMENTO: 'Planejamento', EM_ANDAMENTO: 'Em andamento', PARALISADA: 'Paralisada', CONCLUIDA: 'Concluída' };
const STATUS_COLOR = { PLANEJAMENTO: 'badge-cinza', EM_ANDAMENTO: 'badge-azul', PARALISADA: 'badge-amarelo', CONCLUIDA: 'badge-verde' };

export default function ClienteDashboard() {
  const { data: obras, isLoading } = useQuery({
    queryKey: ['cliente-obras'],
    queryFn: () => clienteAPI.minhasObras().then((r) => r.data),
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Minhas Obras</h1>
        <p className="text-gray-500 text-sm">{obras?.length || 0} obras vinculadas à sua conta</p>
      </div>

      {obras?.length === 0 ? (
        <div className="card text-center py-16">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhuma obra vinculada à sua conta</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {obras?.map((obra) => {
            const gastoPercent = obra.orcamentoPrevisto > 0
              ? Math.min(100, (obra.gastoTotal / obra.orcamentoPrevisto) * 100)
              : 0;

            return (
              <div key={obra.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{obra.nome}</h2>
                    <p className="text-sm text-gray-500">{obra.endereco}</p>
                  </div>
                  <span className={STATUS_COLOR[obra.status]}>{STATUS_LABEL[obra.status]}</span>
                </div>

                {/* Progresso */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Progresso geral</span>
                    <span className="font-medium">{obra.progressoGeral}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${obra.progressoGeral >= 100 ? 'bg-green-500' : 'bg-primary-500'}`}
                      style={{ width: `${obra.progressoGeral}%` }}
                    />
                  </div>
                </div>

                {/* Orçamento */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Orçamento utilizado</span>
                    <span className={`font-medium ${gastoPercent >= 100 ? 'text-red-600' : gastoPercent >= 80 ? 'text-yellow-600' : 'text-gray-900'}`}>
                      {gastoPercent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${gastoPercent >= 100 ? 'bg-red-500' : gastoPercent >= 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${gastoPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Gasto: {formatCurrency(obra.gastoTotal)}</span>
                    <span>Prev: {formatCurrency(obra.orcamentoPrevisto)}</span>
                  </div>
                </div>

                {/* Datas */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Início: {obra.dataInicio ? format(new Date(obra.dataInicio), 'dd/MM/yyyy') : '—'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} />
                    <span>Prev: {obra.dataPrevisaoFim ? format(new Date(obra.dataPrevisaoFim), 'dd/MM/yyyy') : '—'}</span>
                  </div>
                </div>

                {obra.totalAtualizacoes > 0 && (
                  <p className="text-xs text-primary-600 mb-3">
                    📷 {obra.totalAtualizacoes} atualizações no diário
                  </p>
                )}

                <Link
                  to={`/cliente/obras/${obra.id}`}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                >
                  Ver detalhes <ChevronRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
