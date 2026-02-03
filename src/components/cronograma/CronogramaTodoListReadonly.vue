<template>
  <div class="cronograma-todo-list-readonly">
    <div v-if="loading" class="loading-state">
      <p>Carregando tarefas...</p>
    </div>
    <div v-else-if="todos.length === 0" class="empty-state">
      <p>Nenhuma tarefa cadastrada.</p>
    </div>
    <div v-else class="todo-items-readonly">
      <div class="todo-progress-header">
        <span class="progress-text">
          {{ todosConcluidos }}/{{ todos.length }} concluído{{ todosConcluidos !== 1 ? 's' : '' }}
        </span>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>
      <div class="todos-container">
        <div
          v-for="todo in todos"
          :key="todo.id"
          class="todo-item-readonly"
          :class="{ 'todo-concluido': todo.concluido }"
        >
          <div class="todo-checkbox-readonly">
            <input
              type="checkbox"
              :checked="todo.concluido"
              disabled
              class="checkbox-disabled"
            />
            <span class="todo-descricao">{{ todo.descricao }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { cronogramaService } from '../../services/cronogramaService.js';

const props = defineProps({
  cronogramaId: {
    type: Number,
    required: true
  }
});

const todos = ref([]);
const loading = ref(true);
let pollInterval = null;

const todosConcluidos = computed(() => {
  return todos.value.filter(t => t.concluido).length;
});

const progressPercentage = computed(() => {
  if (todos.value.length === 0) return 0;
  return Math.round((todosConcluidos.value / todos.value.length) * 100);
});

const loadTodos = async () => {
  if (!props.cronogramaId) {
    loading.value = false;
    todos.value = [];
    return;
  }

  try {
    // Não mostrar loading após o primeiro carregamento para atualização silenciosa
    if (todos.value.length === 0) {
      loading.value = true;
    }
    
    const newTodos = await cronogramaService.getTodos(props.cronogramaId);
    
    // Comparar de forma mais eficiente para evitar re-renderizações desnecessárias
    if (newTodos.length !== todos.value.length ||
        !newTodos.every((todo, index) => 
          todos.value[index] && 
          todos.value[index].id === todo.id && 
          todos.value[index].concluido === todo.concluido &&
          todos.value[index].descricao === todo.descricao
        )) {
      todos.value = newTodos;
    }
  } catch (error) {
    console.error('Erro ao carregar tarefas:', error);
    // Não limpar todos em caso de erro, manter os anteriores
  } finally {
    loading.value = false;
  }
};

const startPolling = () => {
  // Limpar intervalo anterior se existir
  stopPolling();
  
  // Carregar imediatamente na primeira vez
  loadTodos();
  
  // Atualizar a cada 3 segundos (sem mostrar loading após primeira vez)
  pollInterval = setInterval(async () => {
    // Verificar se a aba está visível e o cronogramaId ainda é válido
    if (!props.cronogramaId || document.visibilityState !== 'visible') {
      return;
    }
    
    try {
      const newTodos = await cronogramaService.getTodos(props.cronogramaId);
      
      // Comparar e atualizar apenas se houver mudanças reais
      const hasChanges = newTodos.length !== todos.value.length ||
        !newTodos.every((todo, index) => 
          todos.value[index] && 
          todos.value[index].id === todo.id && 
          todos.value[index].concluido === todo.concluido &&
          todos.value[index].descricao === todo.descricao
        );
      
      if (hasChanges) {
        todos.value = newTodos;
      }
    } catch (error) {
      // Silenciar erro em polling para não causar problemas visuais
      // Apenas logar para debug
      console.debug('Erro ao atualizar tarefas (polling):', error);
    }
  }, 3000);
};

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
};

watch(() => props.cronogramaId, (newId, oldId) => {
  // Evitar atualização desnecessária se o ID não mudou
  if (newId === oldId) return;
  
  stopPolling();
  if (newId) {
    startPolling();
  } else {
    todos.value = [];
    loading.value = false;
  }
}, { immediate: false });

onMounted(() => {
  if (props.cronogramaId) {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.cronograma-todo-list-readonly {
  margin-top: 0.75rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 1rem;
  color: var(--text-light, #6b7280);
  font-size: 0.875rem;
}

.todo-progress-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.progress-text {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--bg-color, #f3f4f6);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color, #3b82f6);
  transition: width 0.3s ease;
  border-radius: 9999px;
}

.todos-container {
  max-height: 300px;
  overflow-y: auto;
}

.todo-item-readonly {
  display: flex;
  align-items: center;
  padding: 0.625rem 0.5rem;
  margin-bottom: 0.5rem;
  background-color: #ffffff;
  border-radius: 0.375rem;
  border: 1px solid var(--border-color, #e5e7eb);
}

.todo-item-readonly.todo-concluido {
  opacity: 0.7;
  background-color: #ffffff;
  border-left: 3px solid #10b981;
}

.todo-checkbox-readonly {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.checkbox-disabled {
  width: 1.125rem;
  height: 1.125rem;
  cursor: not-allowed;
  opacity: 0.6;
}

.todo-descricao {
  font-size: 0.875rem;
  color: var(--text-color);
  flex: 1;
}

.todo-concluido .todo-descricao {
  text-decoration: line-through;
  color: var(--text-light, #6b7280);
}

.todos-container::-webkit-scrollbar {
  width: 6px;
}

.todos-container::-webkit-scrollbar-track {
  background: var(--bg-color, #f9fafb);
  border-radius: 3px;
}

.todos-container::-webkit-scrollbar-thumb {
  background: var(--border-color, #d1d5db);
  border-radius: 3px;
}

.todos-container::-webkit-scrollbar-thumb:hover {
  background: var(--text-light, #9ca3af);
}
</style>
