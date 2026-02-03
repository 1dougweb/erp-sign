<template>
  <div class="todo-item" :class="{ 'todo-concluido': todo.concluido }">
    <div class="drag-handle" title="Arrastar para reordenar">
      <Bars3Icon class="icon" />
    </div>
    <div class="todo-checkbox">
      <input
        type="checkbox"
        :checked="todo.concluido"
        @change.stop="toggleConcluido"
        @click.stop
      />
      <span class="todo-descricao" @click.stop="toggleConcluido">{{ todo.descricao }}</span>
    </div>
    <div class="todo-actions">
      <button class="btn-icon" @click="$emit('edit', todo)" title="Editar">
        <PencilIcon class="icon" />
      </button>
      <button class="btn-icon btn-danger" @click="$emit('delete', todo.id)" title="Excluir">
        <TrashIcon class="icon" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { PencilIcon, TrashIcon, Bars3Icon } from '@heroicons/vue/24/outline';
import { todoService } from '../../services/todoService.js';
import { useToast } from 'vue-toastification';

const props = defineProps({
  todo: {
    type: Object,
    required: true
  },
  updateService: {
    type: [Object, Function],
    default: null
  }
});

const emit = defineEmits(['edit', 'delete', 'update']);

const toast = useToast();

const toggleConcluido = async () => {
  const novoEstado = !props.todo.concluido;
  
  // Atualização otimista - atualizar UI imediatamente
  const todoOtimista = { ...props.todo, concluido: novoEstado };
  emit('update', todoOtimista);
  
  try {
    let updated;
    
    // Se houver um serviço customizado, usar ele
    if (props.updateService) {
      // Se for um objeto com método update, usar ele
      if (typeof props.updateService === 'object' && props.updateService.update) {
        updated = await props.updateService.update(props.todo.id, {
          concluido: novoEstado
        });
      } 
      // Se for uma função diretamente, usar ela
      else if (typeof props.updateService === 'function') {
        updated = await props.updateService(props.todo.id, {
          concluido: novoEstado
        });
      }
    } else {
      // Usar o serviço padrão
      updated = await todoService.update(props.todo.id, {
        concluido: novoEstado
      });
    }
    
    // Atualizar com dados do servidor
    if (updated) {
      emit('update', updated);
    }
  } catch (error) {
    // Reverter em caso de erro
    emit('update', props.todo);
    toast.error('Erro ao atualizar todo');
  }
};
</script>

<style scoped>
.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: var(--bg-color);
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
  transition: background-color 0.2s;
  gap: 0.5rem;
}

.drag-handle {
  cursor: grab;
  opacity: 0.4;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  padding: 0.25rem;
  flex-shrink: 0;
}

.drag-handle:hover {
  opacity: 0.7;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle .icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-light);
}

.todo-item:hover {
  background-color: #f3f4f6;
}

.todo-concluido {
  opacity: 0.7;
  background-color: #f0fdf4;
  border-left: 3px solid var(--secondary-color);
}

.todo-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  cursor: pointer;
}

.todo-checkbox input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.todo-descricao {
  font-size: 0.875rem;
  color: var(--text-color);
}

.todo-concluido .todo-descricao {
  text-decoration: line-through;
  color: var(--text-light);
}

.todo-actions {
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
  width: 1rem;
  height: 1rem;
}

.btn-icon.btn-danger .icon {
  color: var(--danger-color);
}
</style>
