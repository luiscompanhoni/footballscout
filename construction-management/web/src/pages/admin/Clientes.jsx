import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserCircle } from 'lucide-react';
import { clienteAPI, authAPI } from '../../services/api.js';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function ClienteModal({ onClose }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { role: 'CLIENTE' },
  });
  const mutation = useMutation({
    mutationFn: (data) => authAPI.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente cadastrado!');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao cadastrar'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Novo Cliente</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" {...register('nome', { required: true })} />
          </div>
          <div>
            <label className="label">E-mail *</label>
            <input type="email" className="input" {...register('email', { required: true })} />
            {errors.email && <p className="text-red-500 text-xs mt-1">E-mail inválido</p>}
          </div>
          <div>
            <label className="label">Senha *</label>
            <input type="password" className="input" {...register('senha', { required: true, minLength: 6 })} />
            {errors.senha && <p className="text-red-500 text-xs mt-1">Mínimo 6 caracteres</p>}
          </div>
          <input type="hidden" value="CLIENTE" {...register('role')} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminClientes() {
  const [showModal, setShowModal] = useState(false);
  const { data: clientes, isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteAPI.listarClientes().then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm">{clientes?.length || 0} clientes cadastrados</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {isLoading ? <p className="text-gray-400">Carregando...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes?.length === 0 && (
            <div className="col-span-3 card text-center py-8">
              <UserCircle size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-400">Nenhum cliente cadastrado</p>
            </div>
          )}
          {clientes?.map((c) => (
            <div key={c.id} className="card flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-700 font-bold text-lg">{c.nome[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{c.nome}</h3>
                <p className="text-sm text-gray-500 truncate">{c.email}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{c._count?.obras || 0} obras</span>
                  <span>·</span>
                  <span>Desde {format(new Date(c.createdAt), 'MM/yyyy')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ClienteModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
