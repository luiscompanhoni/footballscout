import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Clock } from 'lucide-react';
import { equipeAPI, obrasAPI } from '../../services/api.js';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

function ProfissionalModal({ profissional, onClose }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: profissional || {},
  });
  const mutation = useMutation({
    mutationFn: (data) =>
      profissional
        ? equipeAPI.atualizarProfissional(profissional.id, data)
        : equipeAPI.criarProfissional(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });
      toast.success(profissional ? 'Profissional atualizado!' : 'Profissional criado!');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{profissional ? 'Editar Profissional' : 'Novo Profissional'}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nome *</label>
              <input className="input" {...register('nome', { required: true })} />
            </div>
            <div>
              <label className="label">Função *</label>
              <input className="input" placeholder="ex: Pedreiro, Eletricista..." {...register('funcao', { required: true })} />
            </div>
            <div>
              <label className="label">CPF</label>
              <input className="input" {...register('cpf')} />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" {...register('telefone')} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" className="input" {...register('email')} />
            </div>
            <div>
              <label className="label">Valor/Dia (R$)</label>
              <input type="number" step="0.01" className="input" {...register('valorDia')} />
            </div>
            <div>
              <label className="label">Valor/Hora (R$)</label>
              <input type="number" step="0.01" className="input" {...register('valorHora')} />
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

function AlocarModal({ onClose }) {
  const queryClient = useQueryClient();
  const { data: obras } = useQuery({ queryKey: ['obras'], queryFn: () => obrasAPI.listar().then(r => r.data) });
  const { data: profissionais } = useQuery({ queryKey: ['profissionais'], queryFn: () => equipeAPI.listarProfissionais().then(r => r.data) });
  const { register, handleSubmit } = useForm();
  const mutation = useMutation({
    mutationFn: equipeAPI.alocar,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profissionais'] }); toast.success('Profissional alocado!'); onClose(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro'),
  });
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Alocar em Obra</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="label">Profissional *</label>
            <select className="input" {...register('profissionalId', { required: true })}>
              <option value="">Selecione</option>
              {profissionais?.map(p => <option key={p.id} value={p.id}>{p.nome} — {p.funcao}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Obra *</label>
            <select className="input" {...register('obraId', { required: true })}>
              <option value="">Selecione</option>
              {obras?.obras?.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Alocar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HorasModal({ alocacaoId, onClose }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm({ defaultValues: { data: new Date().toISOString().split('T')[0] } });
  const mutation = useMutation({
    mutationFn: (data) => equipeAPI.registrarHoras({ ...data, profissionalObraId: alocacaoId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profissionais'] }); toast.success('Horas registradas!'); onClose(); },
    onError: () => toast.error('Erro'),
  });
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Registrar Horas</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div><label className="label">Data *</label><input type="date" className="input" {...register('data', { required: true })} /></div>
          <div><label className="label">Horas Trabalhadas *</label><input type="number" step="0.5" min={0} className="input" {...register('horasTrabalhadas', { required: true })} /></div>
          <div><label className="label">Valor Total (R$) *</label><input type="number" step="0.01" min={0} className="input" {...register('valorTotal', { required: true })} /></div>
          <div><label className="label">Observação</label><input className="input" {...register('observacao')} /></div>
          <div className="flex gap-3"><button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button><button type="submit" className="btn-primary flex-1">Registrar</button></div>
        </form>
      </div>
    </div>
  );
}

export default function AdminEquipe() {
  const [modal, setModal] = useState(null);
  const { data: profissionais, isLoading } = useQuery({
    queryKey: ['profissionais'],
    queryFn: () => equipeAPI.listarProfissionais().then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Equipe</h1><p className="text-gray-500 text-sm">{profissionais?.length || 0} profissionais</p></div>
        <div className="flex gap-2">
          <button onClick={() => setModal({ type: 'alocar' })} className="btn-secondary flex items-center gap-2"><Users size={16} /> Alocar</button>
          <button onClick={() => setModal({ type: 'novo' })} className="btn-primary flex items-center gap-2"><Plus size={16} /> Novo</button>
        </div>
      </div>

      {isLoading ? <p className="text-gray-400">Carregando...</p> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {profissionais?.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{p.nome}</h3>
                  <p className="text-sm text-gray-500">{p.funcao}</p>
                </div>
                <button onClick={() => setModal({ type: 'edit', profissional: p })} className="text-xs text-primary-600 hover:underline">Editar</button>
              </div>
              {(p.valorDia || p.valorHora) && (
                <p className="text-xs text-gray-400 mb-2">
                  {p.valorDia && `${formatCurrency(p.valorDia)}/dia`}
                  {p.valorDia && p.valorHora && ' · '}
                  {p.valorHora && `${formatCurrency(p.valorHora)}/hora`}
                </p>
              )}
              {p.obras?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500">Obras ativas:</p>
                  {p.obras.map((ao) => (
                    <div key={ao.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5">
                      <span className="text-sm">{ao.obra.nome}</span>
                      <button
                        onClick={() => setModal({ type: 'horas', alocacaoId: ao.id })}
                        className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                      >
                        <Clock size={12} /> Registrar horas
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal?.type === 'novo' && <ProfissionalModal onClose={() => setModal(null)} />}
      {modal?.type === 'edit' && <ProfissionalModal profissional={modal.profissional} onClose={() => setModal(null)} />}
      {modal?.type === 'alocar' && <AlocarModal onClose={() => setModal(null)} />}
      {modal?.type === 'horas' && <HorasModal alocacaoId={modal.alocacaoId} onClose={() => setModal(null)} />}
    </div>
  );
}
