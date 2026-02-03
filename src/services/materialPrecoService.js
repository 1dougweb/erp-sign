import api from './api.js';

export const materialPrecoService = {
  async getAll() {
    const response = await api.get('/material-precos');
    return response.data;
  },

  async getByMaterial(materialId) {
    const response = await api.get(`/material-precos/material/${materialId}`);
    return response.data;
  },

  async create(preco) {
    const response = await api.post('/material-precos', preco);
    return response.data;
  },

  async update(id, preco) {
    const response = await api.put(`/material-precos/${id}`, preco);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/material-precos/${id}`);
    return response.data;
  }
};
