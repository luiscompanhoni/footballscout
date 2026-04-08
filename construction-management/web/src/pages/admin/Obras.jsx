import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2, MapPin, Calendar, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import { obrasAPI, clienteAPI } from '../../services/api.js';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['PLANEJAMENTO', 'EM_ANDAMENTO', 'PARALISADA', 'CONCLUIDA'];
const STATUS_LABEL = { PLANEJAMENTO: 'Planejamento', EM_ANDAMENTO: 'Em andamento', PARALISADA: 'Paralisada', CONCLUIDA: 'Concluída' };
const STATUS_COLOR = { PLANEJAMENTO: 'badge-cinza', EM_ANDAMENTO: 'badge-azul', PARALISADA: 'badge-amarelo', CONCLUIDA: 'badge-verde' };

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

function ObraModal({ obra, onClose }) {
  const queryClient = useQueryClient();
  const { data: clientesData } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteAPI.listarClientes().then((r) => r.data),
  });

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: obra
      ? {
          nome: obra.nome,
          endereco: obra.endereco,
          descricao: obra.descricao || '',
          clienteId: obra.clienteId,
          dataInicio: obra.dataInicio?.split('T')[0],
          dataPrevisaoFim: obra.dataPrevisaoFim?.split('T')[0],
          orcamentoPrevisto: obra.orcamentoPrevisto,
          status: obra.status,
        }
      : {},
  });

  const mutation = useMutation({
    mutationFn: (data) => obra ? obrasAPI.atualizar(obra.id, data) : obrasAPI.criar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      toast.success(obra ? 'Obra atualizada!' : 'Obra criada!');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao salvar'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{obra ? 'Editar Obra' : 'Nova Obra'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Nome da Obra *</label>
              <input className="input" {...register('nome', { required: true })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Endereço *</label>
              <input className="input" {...register('endereco', { required: true })} />
            </div>
            <div>
              <label className="label">Cliente *</label>
              <select className="input" {...register('clienteId', { required: true })}>
                <option value="">Selecione</option>
                {clientesData?.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" {...register('status')}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Data de Início *</label>
              <input type="date" className="input" {...register('dataInicio', { required: true })} />
            </div>
            <div>
              <label className="label">Previsão de Término *</label>
              <input type="date" className="input" {...register('dataPrevisaoFim', { required: true })} />
            </div>
            <div>
              <label className="label">Orçamento Previsto (R$) *</label>
              <input type="number" step="0.01" className="input" {...register('orcamentoPrevisto', { required: true, min: 0 })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Descrição</label>
              <textarea rows={3} className="input resize-none" {...register('descricao')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminObras() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | obra

  const { data, isLoading } = useQuery({
    queryKey: ['obras', { status: statusFilter }],
    queryFn: () => obrasAPI.listar({ status: statusFilter || undefined }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => obrasAPI.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      toast.success('Obra removida');
    },
    onError: () => toast.error('Erro ao remover obra'),
  });

  const obras = data?.obras?.filter((o) =>
    o.nome.toLowerCase().includes(search.toLowerCase()) ||
    o.cliente?.nome.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Obras</h1>
          <p className="text-gray-500 text-sm">{data?.total || 0} obras cadastradas</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nova Obra
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por nome ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : obras.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nenhuma obra encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {obras.map((obra) => (
            <div key={obra.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{obra.nome}</h3>
                  <p className="text-sm text-gray-500">{obra.cliente?.nome}</p>
                </div>
                <span className={STATUS_COLOR[obra.status]}>{STATUS_LABEL[obra.status]}</span>
              </div>
              <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="flex-shrink-0" />
                  <span className="truncate">{obra.endereco}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={13} />
                  <span>
                    {obra.dataInicio ? format(new Date(obra.dataInicio), 'dd/MM/yyyy') : '—'} →{' '}
                    {obra.dataPrevisaoFim ? format(new Date(obra.dataPrevisaoFim), 'dd/MM/yyyy') : '—'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400">Progresso</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-24 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-primary-600 h-1.5 rounded-full"
                        style={{ width: `${obra.progressoGeral}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{obra.progressoGeral}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Orçamento</p>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(obra.orcamentoPrevisto)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <Link to={`/admin/obras/${obra.id}`} className="btn-primary flex-1 flex items-center justify-center gap-1 text-sm py-1.5">
                  Ver detalhes <ChevronRight size={14} />
                </Link>
                <button
                  onClick={() => setModal(obra)}
                  className="btn-secondary p-1.5"
                  title="Editar"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Remover esta obra?')) deleteMutation.mutate(obra.id);
                  }}
                  className="btn-danger p-1.5"
                  title="Remover"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ObraModal
          obra={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
