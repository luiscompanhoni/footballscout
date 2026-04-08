import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { notificacoesAPI } from '../services/api.js';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: () => notificacoesAPI.listar({ limit: 10 }).then((r) => r.data),
    refetchInterval: 30000, // atualiza a cada 30s
  });

  const marcarLidaMutation = useMutation({
    mutationFn: (id) => notificacoesAPI.marcarLida(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificacoes'] }),
  });

  const marcarTodasMutation = useMutation({
    mutationFn: () => notificacoesAPI.marcarTodasLidas(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificacoes'] }),
  });

  const naoLidas = data?.naoLidasCount || 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell size={20} className="text-gray-600" />
        {naoLidas > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Notificações</h3>
              {naoLidas > 0 && (
                <button
                  onClick={() => marcarTodasMutation.mutate()}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {!data?.notificacoes?.length ? (
                <p className="text-center text-gray-500 text-sm py-8">Nenhuma notificação</p>
              ) : (
                data.notificacoes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.lida && marcarLidaMutation.mutate(n.id)}
                    className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !n.lida ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.lida && <div className="w-2 h-2 rounded-full bg-primary-600 mt-1.5 flex-shrink-0" />}
                      <div className={!n.lida ? '' : 'pl-4'}>
                        <p className="text-sm font-medium text-gray-900">{n.titulo}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.mensagem}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
