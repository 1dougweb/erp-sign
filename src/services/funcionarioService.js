import api from './api.js';

export const funcionarioService = {
  async getAll() {
    const response = await api.get('/funcionarios');
    return response.data;
  },

  async create(funcionario) {
    const response = await api.post('/funcionarios', funcionario);
    return response.data;
  },

  async update(id, funcionario) {
    const response = await api.put(`/funcionarios/${id}`, funcionario);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/funcionarios/${id}`);
    return response.data;
  }
};
