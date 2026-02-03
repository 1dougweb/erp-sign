import api from './api.js';

export const materialService = {
  async getAll() {
    const response = await api.get('/materiais');
    return response.data;
  },

  async create(material) {
    const response = await api.post('/materiais', material);
    return response.data;
  },

  async update(id, material) {
    const response = await api.put(`/materiais/${id}`, material);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/materiais/${id}`);
    return response.data;
  }
};
