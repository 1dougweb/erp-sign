<template>
  <div class="tarefa-card" :class="{ 'tarefa-dragging': isDragging }">
    <div class="tarefa-header">
      <h4 class="tarefa-titulo">{{ tarefa.titulo }}</h4>
      <div class="tarefa-actions">
        <button class="btn-icon" @click="$emit('edit', tarefa)" title="Editar">
          <PencilIcon class="icon" />
        </button>
        <button class="btn-icon btn-danger" @click="$emit('delete', tarefa.id)" title="Excluir">
          <TrashIcon class="icon" />
        </button>
      </div>
    </div>
    <p v-if="tarefa.descricao" class="tarefa-descricao">{{ tarefa.descricao }}</p>
    <div class="tarefa-footer">
      <button class="btn btn-outline" @click="$emit('view-todos', tarefa)">
        Ver Todos ({{ todosCount }})
      </button>
    </div>
  </div>
</template>

<script setup>
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/outline';

defineProps({
  tarefa: {
    type: Object,
    required: true
  },
  todosCount: {
    type: Number,
    default: 0
  },
  isDragging: {
    type: Boolean,
    default: false
  }
});

defineEmits(['edit', 'delete', 'view-todos']);
</script>

<style scoped>
.tarefa-card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  padding: 1.25rem;
  margin-bottom: 1rem;
  cursor: move;
  transition: transform 0.2s, box-shadow 0.2s;
}

.tarefa-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.tarefa-dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}

.tarefa-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.tarefa-titulo {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
  flex: 1;
}

.tarefa-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.7;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  opacity: 1;
}

.btn-icon .icon {
  width: 1.125rem;
  height: 1.125rem;
}

.btn-icon.btn-danger .icon {
  color: var(--danger-color);
}

.tarefa-descricao {
  color: var(--text-light);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.tarefa-footer {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}
</style>
