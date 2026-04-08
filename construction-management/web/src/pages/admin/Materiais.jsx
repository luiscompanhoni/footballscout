import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, ShoppingCart } from 'lucide-react';
import { materiaisAPI, obrasAPI } from '../../services/api.js';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

function MaterialModal({ obraId, onClose }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const mutation = useMutation({
    mutationFn: (data) => materiaisAPI.criar({ ...data, obraId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['materiais', obraId] }); toast.success('Material criado!'); onClose(); },
    onError: () => toast.error('Erro ao criar material'),
  });
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Novo Material</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div><label className="label">Nome *</label><input className="input" {...register('nome', { required: true })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Unidade *</label><input className="input" placeholder="ex: m², kg, un" {...register('unidade', { required: true })} /></div>
            <div><label className="label">Qtd Solicitada *</label><input type="number" step="0.01" className="input" {...register('quantSolicitada', { required: true, min: 0 })} /></div>
          </div>
          <div className="flex gap-3"><button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button><button type="submit" disabled={isSubmitting} className="btn-primary flex-1">Criar</button></div>
        </form>
      </div>
    </div>
  );
}

function CompraModal({ materialId, onClose }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm({ defaultValues: { data: new Date().toISOString().split('T')[0] } });
  const mutation = useMutation({
    mutationFn: (data) => materiaisAPI.registrarCompra(materialId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['materiais'] }); toast.success('Compra registrada!'); onClose(); },
    onError: () => toast.error('Erro ao registrar compra'),
  });
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Registrar Compra</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Quantidade *</label><input type="number" step="0.01" min={0} className="input" {...register('quantidade', { required: true })} /></div>
            <div><label className="label">Valor Unitário *</label><input type="number" step="0.01" min={0} className="input" {...register('valorUnit', { required: true })} /></div>
          </div>
          <div><label className="label">Fornecedor *</label><input className="input" {...register('fornecedor', { required: true })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Data *</label><input type="date" className="input" {...register('data', { required: true })} /></div>
            <div><label className="label">Nota Fiscal</label><input className="input" {...register('notaFiscal')} /></div>
          </div>
          <div className="flex gap-3"><button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button><button type="submit" className="btn-primary flex-1">Registrar</button></div>
        </form>
      </div>
    </div>
  );
}

export default function AdminMateriais() {
  const [obraId, setObraId] = useState('');
  const [modal, setModal] = useState(null);

  const { data: obras } = useQuery({ queryKey: ['obras'], queryFn: () => obrasAPI.listar().then(r => r.data) });
  const { data: materiais, isLoading } = useQuery({
    queryKey: ['materiais', obraId],
    queryFn: () => materiaisAPI.listar(obraId).then(r => r.data),
    enabled: !!obraId,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Materiais e Estoque</h1>
        <button onClick={() => obraId && setModal({ type: 'material' })} disabled={!obraId} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Plus size={16} /> Novo Material
        </button>
      </div>

      <div>
        <label className="label">Selecione a Obra</label>
        <select className="input max-w-sm" value={obraId} onChange={e => setObraId(e.target.value)}>
          <option value="">Selecione</option>
          {obras?.obras?.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
      </div>

      {obraId && (
        isLoading ? <p className="text-gray-400">Carregando...</p> :
        materiais?.length === 0 ? (
          <div className="card text-center py-8"><Package size={40} className="mx-auto text-gray-300 mb-2" /><p className="text-gray-400">Nenhum material cadastrado</p></div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Material', 'Unidade', 'Solicitado', 'Recebido', 'Utilizado', 'Total Gasto', 'Ações'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materiais?.map(m => {
                  const totalGasto = m.compras?.reduce((s, c) => s + c.valorTotal, 0) || 0;
                  return (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-medium">{m.nome}</td>
                      <td className="py-2.5 px-3 text-gray-500">{m.unidade}</td>
                      <td className="py-2.5 px-3">{m.quantSolicitada}</td>
                      <td className="py-2.5 px-3">{m.quantRecebida}</td>
                      <td className="py-2.5 px-3">{m.quantUtilizada}</td>
                      <td className="py-2.5 px-3">{formatCurrency(totalGasto)}</td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => setModal({ type: 'compra', materialId: m.id })}
                          className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                        >
                          <ShoppingCart size={12} /> Compra
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {modal?.type === 'material' && <MaterialModal obraId={obraId} onClose={() => setModal(null)} />}
      {modal?.type === 'compra' && <CompraModal materialId={modal.materialId} onClose={() => setModal(null)} />}
    </div>
  );
}
