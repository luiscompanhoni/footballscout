import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Injeta token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gerobras_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Trata erros de autenticação globalmente
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gerobras_token');
      localStorage.removeItem('gerobras_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  esqueciSenha: (email) => api.post('/auth/esqueci-senha', { email }),
  redefinirSenha: (data) => api.post('/auth/redefinir-senha', data),
};

// ── Obras ─────────────────────────────────────────────────────────────────────
export const obrasAPI = {
  listar: (params) => api.get('/obras', { params }),
  buscar: (id) => api.get(`/obras/${id}`),
  criar: (data) => api.post('/obras', data),
  atualizar: (id, data) => api.put(`/obras/${id}`, data),
  remover: (id) => api.delete(`/obras/${id}`),
  dashboard: () => api.get('/obras/dashboard/resumo'),
};

// ── Orçamentos ────────────────────────────────────────────────────────────────
export const orcamentosAPI = {
  listar: (obraId) => api.get('/orcamentos', { params: { obraId } }),
  buscar: (id) => api.get(`/orcamentos/${id}`),
  criar: (data) => api.post('/orcamentos', data),
  aprovar: (id, data) => api.patch(`/orcamentos/${id}/aprovar`, data),
  lancarDespesa: (data) => api.post('/orcamentos/despesa', data),
  listarDespesas: (obraId) => api.get('/orcamentos/despesas/lista', { params: { obraId } }),
};

// ── Etapas ────────────────────────────────────────────────────────────────────
export const etapasAPI = {
  listar: (obraId) => api.get('/etapas', { params: { obraId } }),
  criar: (data) => api.post('/etapas', data),
  atualizar: (id, data) => api.put(`/etapas/${id}`, data),
  atualizarProgresso: (id, percentualReal) =>
    api.patch(`/etapas/${id}/progresso`, { percentualReal }),
  remover: (id) => api.delete(`/etapas/${id}`),
};

// ── Equipe ────────────────────────────────────────────────────────────────────
export const equipeAPI = {
  listarProfissionais: () => api.get('/equipe/profissionais'),
  criarProfissional: (data) => api.post('/equipe/profissionais', data),
  atualizarProfissional: (id, data) => api.put(`/equipe/profissionais/${id}`, data),
  alocar: (data) => api.post('/equipe/alocar', data),
  desalocar: (id) => api.patch(`/equipe/desalocar/${id}`),
  equipeObra: (obraId) => api.get(`/equipe/obra/${obraId}`),
  registrarHoras: (data) => api.post('/equipe/horas', data),
};

// ── Materiais ─────────────────────────────────────────────────────────────────
export const materiaisAPI = {
  listar: (obraId) => api.get('/materiais', { params: { obraId } }),
  criar: (data) => api.post('/materiais', data),
  atualizar: (id, data) => api.put(`/materiais/${id}`, data),
  registrarCompra: (id, data) => api.post(`/materiais/${id}/compra`, data),
  remover: (id) => api.delete(`/materiais/${id}`),
};

// ── Diário ────────────────────────────────────────────────────────────────────
export const diarioAPI = {
  listar: (obraId, page) => api.get('/diario', { params: { obraId, page } }),
  buscar: (id) => api.get(`/diario/${id}`),
  criar: (formData) =>
    api.post('/diario', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  atualizar: (id, formData) =>
    api.put(`/diario/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remover: (id) => api.delete(`/diario/${id}`),
};

// ── Relatórios ────────────────────────────────────────────────────────────────
export const relatoriosAPI = {
  obra: (obraId) => api.get(`/relatorios/obra/${obraId}`),
  obraPDF: (obraId) =>
    api.get(`/relatorios/obra/${obraId}/pdf`, { responseType: 'blob' }),
  obraExcel: (obraId) =>
    api.get(`/relatorios/obra/${obraId}/excel`, { responseType: 'blob' }),
  financeiro: (ano) => api.get('/relatorios/financeiro', { params: { ano } }),
};

// ── Notificações ──────────────────────────────────────────────────────────────
export const notificacoesAPI = {
  listar: (params) => api.get('/notificacoes', { params }),
  marcarLida: (id) => api.patch(`/notificacoes/${id}/ler`),
  marcarTodasLidas: () => api.patch('/notificacoes/ler-todas'),
};

// ── Cliente ───────────────────────────────────────────────────────────────────
export const clienteAPI = {
  minhasObras: () => api.get('/cliente/obras'),
  resumoObra: (obraId) => api.get(`/cliente/obras/${obraId}/resumo`),
  listarClientes: () => api.get('/cliente/usuarios'),
};
