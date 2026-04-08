import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('gerobras_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove(['gerobras_token', 'gerobras_user']);
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  esqueciSenha: (email) => api.post('/auth/esqueci-senha', { email }),
  atualizarFCM: (fcmToken) => api.put('/auth/fcm-token', { fcmToken }),
};

// ── Obras ──────────────────────────────────────────────────────────────────────
export const obrasAPI = {
  listar: (params) => api.get('/obras', { params }),
  buscar: (id) => api.get(`/obras/${id}`),
  criar: (data) => api.post('/obras', data),
  atualizar: (id, data) => api.put(`/obras/${id}`, data),
  dashboard: () => api.get('/obras/dashboard/resumo'),
};

// ── Orçamentos ────────────────────────────────────────────────────────────────
export const orcamentosAPI = {
  listar: (obraId) => api.get('/orcamentos', { params: { obraId } }),
  criar: (data) => api.post('/orcamentos', data),
  aprovar: (id, data) => api.patch(`/orcamentos/${id}/aprovar`, data),
  lancarDespesa: (data) => api.post('/orcamentos/despesa', data),
};

// ── Etapas ────────────────────────────────────────────────────────────────────
export const etapasAPI = {
  listar: (obraId) => api.get('/etapas', { params: { obraId } }),
  atualizarProgresso: (id, percentualReal) =>
    api.patch(`/etapas/${id}/progresso`, { percentualReal }),
};

// ── Diário ────────────────────────────────────────────────────────────────────
export const diarioAPI = {
  listar: (obraId, page = 1) => api.get('/diario', { params: { obraId, page } }),
  criar: (formData) =>
    api.post('/diario', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ── Relatórios ────────────────────────────────────────────────────────────────
export const relatoriosAPI = {
  obra: (obraId) => api.get(`/relatorios/obra/${obraId}`),
  financeiro: (ano) => api.get('/relatorios/financeiro', { params: { ano } }),
};

// ── Notificações ──────────────────────────────────────────────────────────────
export const notificacoesAPI = {
  listar: () => api.get('/notificacoes', { params: { limit: 20 } }),
  marcarLida: (id) => api.patch(`/notificacoes/${id}/ler`),
  marcarTodasLidas: () => api.patch('/notificacoes/ler-todas'),
};

// ── Cliente ───────────────────────────────────────────────────────────────────
export const clienteAPI = {
  minhasObras: () => api.get('/cliente/obras'),
  resumoObra: (obraId) => api.get(`/cliente/obras/${obraId}/resumo`),
};
