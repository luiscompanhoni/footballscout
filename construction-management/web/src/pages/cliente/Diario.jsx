import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clienteAPI, diarioAPI } from '../../services/api.js';
import { BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClienteDiario() {
  const [obraId, setObraId] = useState('');
  const [page, setPage] = useState(1);

  const { data: obras } = useQuery({
    queryKey: ['cliente-obras'],
    queryFn: () => clienteAPI.minhasObras().then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['diario-cliente', obraId, page],
    queryFn: () => diarioAPI.listar(obraId, page).then((r) => r.data),
    enabled: !!obraId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Diário de Obra</h1>
        <p className="text-gray-500 text-sm">Acompanhe as atualizações do andamento das obras</p>
      </div>

      <div>
        <label className="label">Selecione a Obra</label>
        <select
          className="input max-w-sm"
          value={obraId}
          onChange={(e) => { setObraId(e.target.value); setPage(1); }}
        >
          <option value="">Selecione</option>
          {obras?.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
      </div>

      {obraId && (
        isLoading ? <p className="text-gray-400">Carregando...</p> :
        data?.entradas?.length === 0 ? (
          <div className="card text-center py-12">
            <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">Nenhuma atualização publicada ainda</p>
          </div>
        ) : (
          <div className="space-y-6">
            {data?.entradas?.map((entrada) => (
              <div key={entrada.id} className="card">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{entrada.titulo}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(entrada.createdAt), "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{entrada.descricao}</p>
                {entrada.fotos?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                    {entrada.fotos.map((foto, i) => (
                      <a key={i} href={foto} target="_blank" rel="noopener noreferrer" className="block">
                        <img
                          src={foto}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-28 sm:h-36 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {data?.total > data?.limit && (
              <div className="flex justify-center gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary">Anterior</button>
                <span className="py-2 px-3 text-sm text-gray-500">Página {page} de {Math.ceil(data.total / data.limit)}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={data?.entradas?.length < data?.limit} className="btn-secondary">Próxima</button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
