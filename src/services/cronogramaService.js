import api from './api.js';

export const cronogramaService = {
  async getAll() {
    const response = await api.get('/cronogramas');
    return response.data;
  },

  async create(cronograma) {
    const response = await api.post('/cronogramas', cronograma);
    return response.data;
  },

  async update(id, cronograma) {
    const response = await api.put(`/cronogramas/${id}`, cronograma);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/cronogramas/${id}`);
    return response.data;
  },

  async getTiposInstalacao() {
    const response = await api.get('/cronogramas/tipos-instalacao');
    return response.data;
  },

  async updateMaterialQuantidade(cronogramaId, materialId, quantidadeConfirmada) {
    const response = await api.put(`/cronogramas/${cronogramaId}/materiais/${materialId}/quantidade`, {
      quantidade_confirmada: quantidadeConfirmada
    });
    return response.data;
  },

  // Métodos de todos do cronograma
  async getTodos(cronogramaId) {
    const response = await api.get(`/cronogramas/${cronogramaId}/todos`);
    return response.data;
  },

  async createTodo(cronogramaId, todo) {
    const response = await api.post(`/cronogramas/${cronogramaId}/todos`, todo);
    return response.data;
  },

  async updateTodo(cronogramaId, todoId, todo) {
    const response = await api.put(`/cronogramas/${cronogramaId}/todos/${todoId}`, todo);
    return response.data;
  },

  async deleteTodo(cronogramaId, todoId) {
    const response = await api.delete(`/cronogramas/${cronogramaId}/todos/${todoId}`);
    return response.data;
  },

  async reorderTodos(cronogramaId, todos) {
    const response = await api.post(`/cronogramas/${cronogramaId}/todos/reorder`, { todos });
    return response.data;
  }
};
