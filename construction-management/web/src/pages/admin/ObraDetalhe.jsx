import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { obrasAPI, relatoriosAPI } from '../../services/api.js';
import { ArrowLeft, Download, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const STATUS_LABEL = { PLANEJAMENTO: 'Planejamento', EM_ANDAMENTO: 'Em andamento', PARALISADA: 'Paralisada', CONCLUIDA: 'Concluída' };

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function AdminObraDetalhe() {
  const { id } = useParams();

  const { data: obra, isLoading } = useQuery({
    queryKey: ['obra', id],
    queryFn: () => obrasAPI.buscar(id).then((r) => r.data),
  });

  const { data: relatorio } = useQuery({
    queryKey: ['relatorio-obra', id],
    queryFn: () => relatoriosAPI.obra(id).then((r) => r.data),
    enabled: !!id,
  });

  const handlePDF = async () => {
    try {
      const res = await relatoriosAPI.obraPDF(id);
      downloadBlob(new Blob([res.data], { type: 'application/pdf' }), `relatorio-${obra.nome}.pdf`);
    } catch { toast.error('Erro ao gerar PDF'); }
  };

  const handleExcel = async () => {
    try {
      const res = await relatoriosAPI.obraExcel(id);
      downloadBlob(
        new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `relatorio-${obra.nome}.xlsx`
      );
    } catch { toast.error('Erro ao gerar Excel'); }
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400">Carregando...</div>;
  if (!obra) return <div className="text-center py-12 text-red-500">Obra não encontrada</div>;

  const gastoPercent = obra.orcamentoPrevisto > 0
    ? Math.min(100, (relatorio?.financeiro?.gastoTotal / obra.orcamentoPrevisto) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/admin/obras" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Voltar para Obras
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{obra.nome}</h1>
          <p className="text-gray-500 text-sm">{obra.endereco} · Cliente: {obra.cliente?.nome}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePDF} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={14} /> PDF
          </button>
          <button onClick={handleExcel} className="btn-secondary flex items-center gap-2 text-sm">
            <FileSpreadsheet size={14} /> Excel
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Status', value: STATUS_LABEL[obra.status] },
          { label: 'Início', value: obra.dataInicio ? format(new Date(obra.dataInicio), 'dd/MM/yyyy') : '—' },
          { label: 'Previsão Fim', value: obra.dataPrevisaoFim ? format(new Date(obra.dataPrevisaoFim), 'dd/MM/yyyy') : '—' },
          { label: 'Progresso Geral', value: `${obra.progressoGeral || 0}%` },
        ].map(({ label, value }) => (
          <div key={label} className="card">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Financeiro */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Orçamento</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-400">Previsto</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(obra.orcamentoPrevisto)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Realizado</p>
            <p className={`text-xl font-bold ${gastoPercent >= 100 ? 'text-red-600' : gastoPercent >= 80 ? 'text-yellow-600' : 'text-gray-900'}`}>
              {formatCurrency(relatorio?.financeiro?.gastoTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Saldo</p>
            <p className={`text-xl font-bold ${(relatorio?.financeiro?.saldo || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(relatorio?.financeiro?.saldo)}
            </p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Consumo do orçamento</span>
            <span>{gastoPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${gastoPercent >= 100 ? 'bg-red-500' : gastoPercent >= 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${gastoPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Etapas */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Etapas</h2>
        <div className="space-y-3">
          {obra.etapas?.length === 0 && <p className="text-gray-400 text-sm">Nenhuma etapa cadastrada</p>}
          {obra.etapas?.map((etapa) => (
            <div key={etapa.id} className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                {etapa.ordem}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">{etapa.nome}</p>
                  <span className="text-xs text-gray-500">{etapa.percentualReal}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${etapa.percentualReal >= 100 ? 'bg-green-500' : 'bg-primary-500'}`}
                    style={{ width: `${etapa.percentualReal}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Últimas atualizações do diário */}
      {obra.diarioEntradas?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Últimas Atualizações</h2>
          <div className="space-y-4">
            {obra.diarioEntradas.map((entrada) => (
              <div key={entrada.id} className="border-l-2 border-primary-200 pl-4">
                <p className="text-sm font-medium text-gray-900">{entrada.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {format(new Date(entrada.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{entrada.descricao}</p>
                {entrada.fotos?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {entrada.fotos.slice(0, 4).map((foto, i) => (
                      <img key={i} src={foto} alt="" className="w-16 h-16 object-cover rounded-lg border" />
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
