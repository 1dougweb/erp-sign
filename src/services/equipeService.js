import api from './api.js';

export const equipeService = {
  async getAll() {
    const response = await api.get('/equipes');
    return response.data;
  },

  async create(equipe) {
    const response = await api.post('/equipes', equipe);
    return response.data;
  },

  async update(id, equipe) {
    const response = await api.put(`/equipes/${id}`, equipe);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/equipes/${id}`);
    return response.data;
  },

  async addFuncionario(equipeId, funcionarioId) {
    const response = await api.post(`/equipes/${equipeId}/funcionarios`, { funcionario_id: funcionarioId });
    return response.data;
  },

  async removeFuncionario(equipeId, funcionarioId) {
    const response = await api.delete(`/equipes/${equipeId}/funcionarios/${funcionarioId}`);
    return response.data;
  }
};
