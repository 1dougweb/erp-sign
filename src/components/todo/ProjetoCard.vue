<template>
  <div class="projeto-card">
    <div class="projeto-header">
      <h3 class="projeto-nome">{{ projeto.nome }}</h3>
      <div class="projeto-actions">
        <button class="btn-icon" @click="$emit('edit', projeto)" title="Editar">
          <PencilIcon class="icon" />
        </button>
        <button class="btn-icon btn-danger" @click="$emit('delete', projeto.id)" title="Excluir">
          <TrashIcon class="icon" />
        </button>
      </div>
    </div>
    <p v-if="projeto.descricao" class="projeto-descricao">{{ projeto.descricao }}</p>
    <div class="projeto-footer">
      <router-link :to="`/projetos/${projeto.id}/tarefas`" class="btn btn-primary">
        Ver Tarefas
        <ArrowRightIcon class="btn-icon-inline" />
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { PencilIcon, TrashIcon, ArrowRightIcon } from '@heroicons/vue/24/outline';

defineProps({
  projeto: {
    type: Object,
    required: true
  }
});

defineEmits(['edit', 'delete']);
</script>

<style scoped>
.projeto-card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.projeto-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.projeto-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.projeto-nome {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
  flex: 1;
}

.projeto-actions {
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

.btn-icon-inline {
  width: 1rem;
  height: 1rem;
  margin-left: 0.5rem;
}

.projeto-descricao {
  color: var(--text-light);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.projeto-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}
</style>
