import api from './api.js';

export const orcamentoService = {
  async getAll() {
    const response = await api.get('/orcamentos');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/orcamentos/${id}`);
    return response.data;
  },

  async create(orcamento) {
    const response = await api.post('/orcamentos', orcamento);
    return response.data;
  },

  async update(id, orcamento) {
    const response = await api.put(`/orcamentos/${id}`, orcamento);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/orcamentos/${id}`);
    return response.data;
  },

  async calcularTotal(id) {
    const response = await api.post(`/orcamentos/${id}/calcular-total`);
    return response.data;
  }
};
