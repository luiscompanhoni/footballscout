import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { etapasAPI, obrasAPI } from '../../services/api.js';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

function EtapaModal({ etapa, obraId, onClose }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: etapa
      ? {
          nome: etapa.nome,
          descricao: etapa.descricao || '',
          ordem: etapa.ordem,
          percentualPrev: etapa.percentualPrev,
          percentualReal: etapa.percentualReal,
          dataInicio: etapa.dataInicio?.split('T')[0] || '',
          dataFim: etapa.dataFim?.split('T')[0] || '',
        }
      : { ordem: 1, percentualPrev: 0, percentualReal: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      etapa
        ? etapasAPI.atualizar(etapa.id, data)
        : etapasAPI.criar({ ...data, obraId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      toast.success(etapa ? 'Etapa atualizada!' : 'Etapa criada!');
      onClose();
    },
    onError: () => toast.error('Erro ao salvar etapa'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{etapa ? 'Editar Etapa' : 'Nova Etapa'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nome *</label>
              <input className="input" {...register('nome', { required: true })} />
            </div>
            <div>
              <label className="label">Ordem *</label>
              <input type="number" min={1} className="input" {...register('ordem', { required: true })} />
            </div>
            <div>
              <label className="label">% Previsto</label>
              <input type="number" min={0} max={100} step="0.1" className="input" {...register('percentualPrev')} />
            </div>
            <div>
              <label className="label">% Realizado</label>
              <input type="number" min={0} max={100} step="0.1" className="input" {...register('percentualReal')} />
            </div>
            <div>
              <label className="label">Data Início</label>
              <input type="date" className="input" {...register('dataInicio')} />
            </div>
            <div>
              <label className="label">Data Fim</label>
              <input type="date" className="input" {...register('dataFim')} />
            </div>
            <div className="col-span-2">
              <label className="label">Descrição</label>
              <textarea rows={2} className="input resize-none" {...register('descricao')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminEtapas() {
  const queryClient = useQueryClient();
  const [obraId, setObraId] = useState('');
  const [modal, setModal] = useState(null);

  const { data: obrasData } = useQuery({
    queryKey: ['obras'],
    queryFn: () => obrasAPI.listar().then((r) => r.data),
  });

  const { data: etapas, isLoading } = useQuery({
    queryKey: ['etapas', obraId],
    queryFn: () => etapasAPI.listar(obraId).then((r) => r.data),
    enabled: !!obraId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => etapasAPI.remover(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['etapas'] }); toast.success('Etapa removida'); },
    onError: () => toast.error('Erro ao remover'),
  });

  const progressoMutation = useMutation({
    mutationFn: ({ id, valor }) => etapasAPI.atualizarProgresso(id, valor),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['etapas'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Etapas da Obra</h1>
        <button
          onClick={() => obraId && setModal('new')}
          disabled={!obraId}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={16} /> Nova Etapa
        </button>
      </div>

      <div>
        <label className="label">Selecione a Obra</label>
        <select className="input max-w-sm" value={obraId} onChange={(e) => setObraId(e.target.value)}>
          <option value="">Selecione uma obra</option>
          {obrasData?.obras?.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
      </div>

      {obraId && (
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-gray-400">Carregando...</p>
          ) : etapas?.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-400">Nenhuma etapa cadastrada para esta obra</p>
            </div>
          ) : (
            etapas?.map((etapa) => (
              <div key={etapa.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {etapa.ordem}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{etapa.nome}</h3>
                      {etapa.descricao && <p className="text-xs text-gray-500">{etapa.descricao}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setModal(etapa)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <Pencil size={14} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => confirm('Remover etapa?') && deleteMutation.mutate(etapa.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Previsto ({etapa.percentualPrev}%)</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${etapa.percentualPrev}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Realizado ({etapa.percentualReal}%)</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${etapa.percentualReal >= 100 ? 'bg-green-500' : 'bg-primary-500'}`}
                        style={{ width: `${etapa.percentualReal}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <label className="text-xs text-gray-500">Atualizar progresso:</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    defaultValue={etapa.percentualReal}
                    className="flex-1"
                    onMouseUp={(e) => progressoMutation.mutate({ id: etapa.id, valor: Number(e.target.value) })}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {modal && (
        <EtapaModal
          etapa={modal === 'new' ? null : modal}
          obraId={obraId}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
