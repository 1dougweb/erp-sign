import api from './api.js';

export const requisicaoService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.solicitante_id) params.append('solicitante_id', filters.solicitante_id);
    
    const response = await api.get(`/requisicoes?${params.toString()}`);
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/requisicoes/${id}`);
    return response.data;
  },

  async create(requisicao) {
    const response = await api.post('/requisicoes', requisicao);
    return response.data;
  },

  async aprovar(id, data) {
    const response = await api.put(`/requisicoes/${id}/aprovar`, data);
    return response.data;
  },

  async cancelar(id) {
    const response = await api.put(`/requisicoes/${id}/cancelar`);
    return response.data;
  }
};
