import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clienteAPI } from '../../services/api.js';
import { ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const STATUS_LABEL = { PLANEJAMENTO: 'Planejamento', EM_ANDAMENTO: 'Em andamento', PARALISADA: 'Paralisada', CONCLUIDA: 'Concluída' };

export default function ClienteObraDetalhe() {
  const { id } = useParams();
  const { data: resumo, isLoading } = useQuery({
    queryKey: ['cliente-obra-resumo', id],
    queryFn: () => clienteAPI.resumoObra(id).then((r) => r.data),
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400">Carregando...</div>;
  if (!resumo) return <div className="text-center py-12 text-red-500">Obra não encontrada</div>;

  const { obra, financeiro, progressoGeral, etapas, ultimasAtualizacoes } = resumo;
  const gastoPercent = obra.orcamentoPrevisto > 0
    ? Math.min(100, (financeiro.gastoTotal / obra.orcamentoPrevisto) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/cliente" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft size={14} /> Minhas obras
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{obra.nome}</h1>
            <p className="text-gray-500 text-sm">{obra.endereco}</p>
          </div>
          <span className="badge-azul">{STATUS_LABEL[obra.status]}</span>
        </div>
      </div>

      {/* Resumo financeiro */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Orçamento</h2>
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div>
            <p className="text-xs text-gray-400">Previsto</p>
            <p className="text-xl font-bold">{formatCurrency(obra.orcamentoPrevisto)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Realizado</p>
            <p className={`text-xl font-bold ${gastoPercent >= 100 ? 'text-red-600' : gastoPercent >= 80 ? 'text-yellow-600' : 'text-gray-900'}`}>
              {formatCurrency(financeiro.gastoTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Saldo</p>
            <p className={`text-xl font-bold ${financeiro.saldo < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(financeiro.saldo)}
            </p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${gastoPercent >= 100 ? 'bg-red-500' : gastoPercent >= 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${gastoPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right">{gastoPercent.toFixed(0)}% do orçamento utilizado</p>
      </div>

      {/* Progresso das etapas */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Progresso das Etapas</h2>
          <span className="text-2xl font-bold text-primary-600">{progressoGeral}%</span>
        </div>
        <div className="space-y-4">
          {etapas?.map((etapa) => (
            <div key={etapa.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-600 flex items-center justify-center">
                    {etapa.ordem}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{etapa.nome}</span>
                </div>
                <span className="text-sm font-medium">{etapa.percentualReal}%</span>
              </div>
              <div className="ml-8 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${etapa.percentualReal >= 100 ? 'bg-green-500' : 'bg-primary-500'}`}
                  style={{ width: `${etapa.percentualReal}%` }}
                />
              </div>
              {(etapa.dataInicio || etapa.dataFim) && (
                <p className="ml-8 text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Calendar size={10} />
                  {etapa.dataInicio && format(new Date(etapa.dataInicio), 'dd/MM/yyyy')}
                  {etapa.dataFim && ` → ${format(new Date(etapa.dataFim), 'dd/MM/yyyy')}`}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feed de atualizações */}
      {ultimasAtualizacoes?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Últimas Atualizações</h2>
          <div className="space-y-6">
            {ultimasAtualizacoes.map((entrada) => (
              <div key={entrada.id} className="border-l-4 border-primary-300 pl-4">
                <h3 className="font-medium text-gray-900">{entrada.titulo}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(new Date(entrada.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-sm text-gray-700 mt-2">{entrada.descricao}</p>
                {entrada.fotos?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                    {entrada.fotos.map((foto, i) => (
                      <a key={i} href={foto} target="_blank" rel="noopener noreferrer">
                        <img src={foto} alt={`Foto ${i + 1}`} className="w-full h-24 object-cover rounded-lg border hover:opacity-90 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
