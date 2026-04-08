import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { orcamentosAPI } from '../../services/api.js';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

function AprovarModal({ orcamento, onClose }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('APROVADO');
  const [justificativa, setJustificativa] = useState('');

  const mutation = useMutation({
    mutationFn: () => orcamentosAPI.aprovar(orcamento.id, { status, justificativa }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-orcamentos'] });
      toast.success(`Orçamento ${status === 'APROVADO' ? 'aprovado' : 'reprovado'}!`);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Avaliar Orçamento</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-medium text-gray-900">{orcamento.titulo}</p>
            <p className="text-sm text-gray-500 mt-1">{orcamento.descricao}</p>
            <p className="text-xl font-bold text-gray-900 mt-2">{formatCurrency(orcamento.valor)}</p>
          </div>

          {orcamento.itens?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Itens:</p>
              {orcamento.itens.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-700">{item.descricao}</span>
                  <span className="text-gray-500">
                    {item.quantidade} × {formatCurrency(item.valorUnit)} = {formatCurrency(item.quantidade * item.valorUnit)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="label">Decisão</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStatus('APROVADO')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  status === 'APROVADO' ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CheckCircle size={16} /> Aprovar
              </button>
              <button
                type="button"
                onClick={() => setStatus('REPROVADO')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  status === 'REPROVADO' ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <XCircle size={16} /> Reprovar
              </button>
            </div>
          </div>

          <div>
            <label className="label">Justificativa {status === 'REPROVADO' ? '(obrigatória)' : '(opcional)'}</label>
            <textarea
              rows={3}
              className="input resize-none"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Descreva o motivo da sua decisão..."
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button
              onClick={() => {
                if (status === 'REPROVADO' && !justificativa.trim()) {
                  toast.error('Justificativa obrigatória para reprovar');
                  return;
                }
                mutation.mutate();
              }}
              disabled={mutation.isPending}
              className={`flex-1 py-2 rounded-lg font-medium text-white transition-colors ${
                status === 'APROVADO' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {mutation.isPending ? 'Enviando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClienteOrcamentos() {
  const [avaliarModal, setAvaliarModal] = useState(null);

  const { data: orcamentos, isLoading } = useQuery({
    queryKey: ['cliente-orcamentos'],
    queryFn: () => orcamentosAPI.listar().then((r) => r.data),
  });

  const pendentes = orcamentos?.filter((o) => o.status === 'PENDENTE') || [];
  const historico = orcamentos?.filter((o) => o.status !== 'PENDENTE') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
        <p className="text-gray-500 text-sm">
          {pendentes.length > 0 && <span className="text-yellow-600 font-medium">{pendentes.length} aguardando sua aprovação</span>}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <>
          {pendentes.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock size={18} className="text-yellow-500" /> Aguardando aprovação
              </h2>
              <div className="space-y-3">
                {pendentes.map((o) => (
                  <div key={o.id} className="card border-l-4 border-yellow-400">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{o.obra?.nome}</p>
                        <h3 className="font-semibold text-gray-900">{o.titulo}</h3>
                        {o.descricao && <p className="text-sm text-gray-600 mt-1">{o.descricao}</p>}
                        <p className="text-xl font-bold text-gray-900 mt-2">{formatCurrency(o.valor)}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Enviado em {format(new Date(o.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <button
                        onClick={() => setAvaliarModal(o)}
                        className="btn-primary text-sm whitespace-nowrap"
                      >
                        Avaliar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {historico.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Histórico</h2>
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Obra', 'Título', 'Valor', 'Status', 'Data'].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((o) => (
                      <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 px-3">{o.obra?.nome}</td>
                        <td className="py-2.5 px-3 font-medium">{o.titulo}</td>
                        <td className="py-2.5 px-3">{formatCurrency(o.valor)}</td>
                        <td className="py-2.5 px-3">
                          {o.status === 'APROVADO'
                            ? <span className="badge-verde flex items-center gap-1 w-fit"><CheckCircle size={12} /> Aprovado</span>
                            : <span className="badge-vermelho flex items-center gap-1 w-fit"><XCircle size={12} /> Reprovado</span>
                          }
                        </td>
                        <td className="py-2.5 px-3 text-gray-400">{format(new Date(o.createdAt), 'dd/MM/yyyy')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {orcamentos?.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-gray-400">Nenhum orçamento encontrado</p>
            </div>
          )}
        </>
      )}

      {avaliarModal && <AprovarModal orcamento={avaliarModal} onClose={() => setAvaliarModal(null)} />}
    </div>
  );
}
