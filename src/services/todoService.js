import api from './api.js';

export const todoService = {
  async getByTarefa(tarefaId) {
    const response = await api.get(`/tarefas/${tarefaId}/todos`);
    return response.data;
  },

  async create(tarefaId, todo) {
    const response = await api.post(`/tarefas/${tarefaId}/todos`, todo);
    return response.data;
  },

  async update(id, todo) {
    const response = await api.put(`/todos/${id}`, todo);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/todos/${id}`);
    return response.data;
  },

  async reorderTodos(tarefaId, todos) {
    const response = await api.post(`/tarefas/${tarefaId}/todos/reorder`, { todos });
    return response.data;
  }
};
