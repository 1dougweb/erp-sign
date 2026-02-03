import api from './api.js';

export const equipamentoService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.status) params.append('status', filters.status);
    if (filters.busca) params.append('busca', filters.busca);
    
    const response = await api.get(`/equipamentos?${params.toString()}`);
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/equipamentos/${id}`);
    return response.data;
  },

  async create(equipamento) {
    const response = await api.post('/equipamentos', equipamento);
    return response.data;
  },

  async update(id, equipamento) {
    const response = await api.put(`/equipamentos/${id}`, equipamento);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/equipamentos/${id}`);
    return response.data;
  },

  async emprestar(id, data) {
    const response = await api.post(`/equipamentos/${id}/emprestar`, data);
    return response.data;
  },

  async devolver(id, data) {
    const response = await api.post(`/equipamentos/${id}/devolver`, data);
    return response.data;
  }
};
