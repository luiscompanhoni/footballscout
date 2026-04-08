import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { HardHat, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { authAPI } from '../services/api.js';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm();

  const onLogin = async (data) => {
    try {
      const user = await login(data.email, data.senha);
      navigate(user.role === 'ADMIN' ? '/admin' : '/cliente', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Credenciais inválidas');
    }
  };

  const onForgot = async (data) => {
    try {
      await authAPI.esqueciSenha(data.email);
      toast.success('Verifique seu e-mail com as instruções.');
      setForgotMode(false);
    } catch {
      toast.error('Erro ao processar solicitação');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-construction-orange rounded-2xl mb-4 shadow-lg">
            <HardHat size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">GerObras</h1>
          <p className="text-gray-400 mt-1">Sistema de Gerenciamento de Obras</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!forgotMode ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Entrar na sua conta</h2>
              <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <label className="label">E-mail</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="seu@email.com"
                    {...register('email', { required: 'E-mail é obrigatório' })}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="label">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="••••••••"
                      {...register('senha', { required: 'Senha é obrigatória' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.senha && <p className="text-red-500 text-xs mt-1">{errors.senha.message}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
                  {isSubmitting ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
              <button
                onClick={() => setForgotMode(true)}
                className="mt-4 text-sm text-primary-600 hover:underline block text-center w-full"
              >
                Esqueci minha senha
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Recuperar senha</h2>
              <p className="text-sm text-gray-500 mb-6">Digite seu e-mail para receber as instruções.</p>
              <form onSubmit={handleSubmit(onForgot)} className="space-y-4">
                <div>
                  <label className="label">E-mail</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="seu@email.com"
                    {...register('email', { required: 'E-mail é obrigatório' })}
                  />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                  {isSubmitting ? 'Enviando...' : 'Enviar instruções'}
                </button>
              </form>
              <button
                onClick={() => setForgotMode(false)}
                className="mt-4 text-sm text-gray-500 hover:underline block text-center w-full"
              >
                Voltar ao login
              </button>
            </>
          )}
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          Demo: admin@gerobras.com / admin123 · cliente@gerobras.com / cliente123
        </p>
      </div>
    </div>
  );
}
