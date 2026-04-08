import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Camera, Trash2, BookOpen } from 'lucide-react';
import { diarioAPI, obrasAPI } from '../../services/api.js';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function DiarioModal({ obraId, onClose }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const mutation = useMutation({
    mutationFn: (data) => {
      const formData = new FormData();
      formData.append('obraId', obraId);
      formData.append('titulo', data.titulo);
      formData.append('descricao', data.descricao);
      if (data.fotos?.[0]) {
        Array.from(data.fotos).forEach((f) => formData.append('fotos', f));
      }
      return diarioAPI.criar(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario', obraId] });
      toast.success('Entrada publicada!');
      onClose();
    },
    onError: () => toast.error('Erro ao publicar'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Nova Entrada no Diário</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="label">Título *</label>
            <input className="input" {...register('titulo', { required: true })} placeholder="ex: Concretagem da laje" />
          </div>
          <div>
            <label className="label">Descrição *</label>
            <textarea rows={4} className="input resize-none" {...register('descricao', { required: true })}
              placeholder="Descreva o progresso, atividades realizadas, observações..." />
          </div>
          <div>
            <label className="label">Fotos (até 10)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors cursor-pointer relative">
              <Camera size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Clique para selecionar fotos</p>
              <input
                type="file"
                multiple
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                {...register('fotos')}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDiario() {
  const queryClient = useQueryClient();
  const [obraId, setObraId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);

  const { data: obras } = useQuery({ queryKey: ['obras'], queryFn: () => obrasAPI.listar().then(r => r.data) });
  const { data, isLoading } = useQuery({
    queryKey: ['diario', obraId, page],
    queryFn: () => diarioAPI.listar(obraId, page).then(r => r.data),
    enabled: !!obraId,
  });

  const deleteMutation = useMutation({
    mutationFn: diarioAPI.remover,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['diario'] }); toast.success('Entrada removida'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Diário de Obra</h1>
        <button onClick={() => obraId && setShowModal(true)} disabled={!obraId} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Plus size={16} /> Nova Entrada
        </button>
      </div>

      <div>
        <label className="label">Selecione a Obra</label>
        <select className="input max-w-sm" value={obraId} onChange={e => { setObraId(e.target.value); setPage(1); }}>
          <option value="">Selecione</option>
          {obras?.obras?.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
      </div>

      {obraId && (
        isLoading ? <p className="text-gray-400">Carregando...</p> :
        data?.entradas?.length === 0 ? (
          <div className="card text-center py-12">
            <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">Nenhuma entrada no diário</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.entradas?.map(entrada => (
              <div key={entrada.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{entrada.titulo}</h3>
                    <p className="text-xs text-gray-400">
                      {format(new Date(entrada.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <button
                    onClick={() => confirm('Remover esta entrada?') && deleteMutation.mutate(entrada.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{entrada.descricao}</p>
                {entrada.fotos?.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                    {entrada.fotos.map((foto, i) => (
                      <a key={i} href={foto} target="_blank" rel="noopener noreferrer">
                        <img src={foto} alt={`Foto ${i + 1}`} className="w-full h-20 object-cover rounded-lg border hover:opacity-90 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {data?.total > data?.limit && (
              <div className="flex justify-center gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary">Anterior</button>
                <span className="py-2 px-3 text-sm text-gray-500">Página {page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={data?.entradas?.length < data?.limit} className="btn-secondary">Próxima</button>
              </div>
            )}
          </div>
        )
      )}

      {showModal && <DiarioModal obraId={obraId} onClose={() => setShowModal(false)} />}
    </div>
  );
}
