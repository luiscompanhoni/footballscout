import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HardHat } from 'lucide-react';
import { authAPI } from '../services/api.js';
import toast from 'react-hot-toast';

export default function RedefinirSenha() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await authAPI.redefinirSenha({ token, novaSenha: data.novaSenha });
      toast.success('Senha redefinida com sucesso!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Token inválido ou expirado');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Link de recuperação inválido.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-construction-orange rounded-2xl mb-4">
            <HardHat size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">GerObras</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold mb-6">Criar nova senha</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Nova senha</label>
              <input
                type="password"
                className="input"
                {...register('novaSenha', { required: true, minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
              />
              {errors.novaSenha && <p className="text-red-500 text-xs mt-1">{errors.novaSenha.message}</p>}
            </div>
            <div>
              <label className="label">Confirmar senha</label>
              <input
                type="password"
                className="input"
                {...register('confirmar', {
                  required: true,
                  validate: (v) => v === watch('novaSenha') || 'As senhas não coincidem',
                })}
              />
              {errors.confirmar && <p className="text-red-500 text-xs mt-1">{errors.confirmar.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
