import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText } from 'lucide-react';
import { orcamentosAPI, obrasAPI } from '../../services/api.js';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLOR = { PENDENTE: 'badge-amarelo', APROVADO: 'badge-verde', REPROVADO: 'badge-vermelho' };
const CATEGORIAS = { MAO_DE_OBRA: 'Mão de Obra', MATERIAIS: 'Materiais', EQUIPAMENTOS: 'Equipamentos', OUTROS: 'Outros' };
const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

function OrcamentoModal({ onClose }) {
  const queryClient = useQueryClient();
  const { data: obrasData } = useQuery({
    queryKey: ['obras'],
    queryFn: () => obrasAPI.listar().then((r) => r.data),
  });
  const { register, handleSubmit, control, watch } = useForm({
    defaultValues: { itens: [{ descricao: '', quantidade: 1, valorUnit: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'itens' });
  const itens = watch('itens');
  const total = itens.reduce((s, i) => s + (Number(i.quantidade) * Number(i.valorUnit)), 0);

  const mutation = useMutation({
    mutationFn: (data) => orcamentosAPI.criar({ ...data, valor: total }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast.success('Orçamento criado!');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Novo Orçamento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="label">Obra *</label>
            <select className="input" {...register('obraId', { required: true })}>
              <option value="">Selecione</option>
              {obrasData?.obras?.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Título *</label>
            <input className="input" {...register('titulo', { required: true })} />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea rows={2} className="input resize-none" {...register('descricao')} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Itens</label>
              <button type="button" onClick={() => append({ descricao: '', quantidade: 1, valorUnit: 0 })}
                className="text-xs text-primary-600 hover:underline">+ Adicionar item</button>
            </div>
            {fields.map((field, i) => (
              <div key={field.id} className="flex gap-2 mb-2">
                <input className="input flex-1" placeholder="Descrição" {...register(`itens.${i}.descricao`)} />
                <input type="number" className="input w-20" placeholder="Qtd" step="0.01" {...register(`itens.${i}.quantidade`)} />
                <input type="number" className="input w-28" placeholder="R$ Unit." step="0.01" {...register(`itens.${i}.valorUnit`)} />
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 px-1">✕</button>
                )}
              </div>
            ))}
            <p className="text-right text-sm font-medium text-gray-900 mt-2">Total: {formatCurrency(total)}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Criar Orçamento</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DespesaModal({ onClose }) {
  const queryClient = useQueryClient();
  const { data: obrasData } = useQuery({
    queryKey: ['obras'],
    queryFn: () => obrasAPI.listar().then((r) => r.data),
  });
  const { register, handleSubmit } = useForm({ defaultValues: { data: new Date().toISOString().split('T')[0] } });
  const mutation = useMutation({
    mutationFn: (data) => orcamentosAPI.lancarDespesa(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast.success('Despesa lançada!');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Lançar Despesa</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="label">Obra *</label>
            <select className="input" {...register('obraId', { required: true })}>
              <option value="">Selecione</option>
              {obrasData?.obras?.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Categoria *</label>
              <select className="input" {...register('categoria', { required: true })}>
                {Object.entries(CATEGORIAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Valor (R$) *</label>
              <input type="number" step="0.01" className="input" {...register('valor', { required: true, min: 0 })} />
            </div>
          </div>
          <div>
            <label className="label">Descrição *</label>
            <input className="input" {...register('descricao', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data *</label>
              <input type="date" className="input" {...register('data', { required: true })} />
            </div>
            <div>
              <label className="label">Fornecedor</label>
              <input className="input" {...register('fornecedor')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Lançar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminOrcamentos() {
  const [modal, setModal] = useState(null);

  const { data: orcamentos, isLoading } = useQuery({
    queryKey: ['orcamentos'],
    queryFn: () => orcamentosAPI.listar().then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500 text-sm">{orcamentos?.length || 0} orçamentos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal('despesa')} className="btn-secondary flex items-center gap-2">
            <Plus size={16} /> Lançar Despesa
          </button>
          <button onClick={() => setModal('orcamento')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Novo Orçamento
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Obra', 'Título', 'Valor', 'Status', 'Justificativa', 'Data'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orcamentos?.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhum orçamento</td></tr>
              )}
              {orcamentos?.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium">{o.obra?.nome}</td>
                  <td className="py-2.5 px-3">{o.titulo}</td>
                  <td className="py-2.5 px-3">{formatCurrency(o.valor)}</td>
                  <td className="py-2.5 px-3">
                    <span className={STATUS_COLOR[o.status]}>{o.status}</span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-500 max-w-xs truncate">{o.justificativa || '—'}</td>
                  <td className="py-2.5 px-3 text-gray-400">{format(new Date(o.createdAt), 'dd/MM/yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'orcamento' && <OrcamentoModal onClose={() => setModal(null)} />}
      {modal === 'despesa' && <DespesaModal onClose={() => setModal(null)} />}
    </div>
  );
}
