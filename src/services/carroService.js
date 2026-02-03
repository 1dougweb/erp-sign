import api from './api.js';

export const carroService = {
  async getAll() {
    const response = await api.get('/carros');
    return response.data;
  },

  async create(carro) {
    const response = await api.post('/carros', carro);
    return response.data;
  },

  async update(id, carro) {
    const response = await api.put(`/carros/${id}`, carro);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/carros/${id}`);
    return response.data;
  }
};
