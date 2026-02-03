import api from './api.js';

export const projetoService = {
  async getAll() {
    const response = await api.get('/projetos');
    return response.data;
  },

  async create(projeto) {
    const response = await api.post('/projetos', projeto);
    return response.data;
  },

  async update(id, projeto) {
    const response = await api.put(`/projetos/${id}`, projeto);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/projetos/${id}`);
    return response.data;
  }
};
