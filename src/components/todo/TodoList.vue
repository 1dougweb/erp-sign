<template>
  <div class="todo-list">
    <div class="todo-list-header">
      <div class="header-left">
        <!-- <h4>Todos</h4>
        <span class="todo-progress" v-if="todos.length > 0">
          {{ todosConcluidos }}/{{ todos.length }} concluídos
        </span> -->
      </div>
      <div class="header-actions">
        <Button
          v-if="todos.length > 0 && todosConcluidos < todos.length"
          @click="marcarTodosConcluidos"
        >
          Marcar todos
        </Button>
        <Button
          v-if="todos.length > 0 && todosConcluidos > 0"
          @click="desmarcarTodosConcluidos"
          class="btn-outline-gray"
        >
          Desmarcar todos
        </Button>
      </div>
      
    </div>
    <!-- Campo de adicionar novo todo -->
    <div class="add-todo-form">
      <input
        v-model="newTodoDescricao"
        type="text"
        placeholder="Adicionar novo todo..."
        class="add-todo-input"
        @keyup.enter="addTodo"
      />
      <button
        type="button"
        @click="addTodo"
        class="add-todo-button"
        :disabled="!newTodoDescricao.trim()"
      >
        +
      </button>
    </div>
    <div v-if="todos.length === 0" class="empty-state">
      <p>Nenhum todo ainda. Adicione o primeiro!</p>
    </div>
    <div v-else class="todo-items">
      <draggable
        v-model="todos"
        :animation="200"
        handle=".drag-handle"
        item-key="id"
        @end="onDragEnd"
      >
        <template #item="{ element: todo }">
          <div class="todo-item-wrapper">
            <TodoItem
              :todo="todo"
              @edit="editTodo"
              @delete="deleteTodo"
              @update="updateTodo"
            />
          </div>
        </template>
      </draggable>
    </div>

    <Modal
      v-model:show="showModal"
      title="Editar Todo"
      @confirm="saveTodo"
      @close="closeModal"
    >
      <Input
        id="descricao"
        v-model="form.descricao"
        label="Descrição"
        placeholder="Ex: Verificar conexões"
        :error="errors.descricao"
        required
      />
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useToast } from 'vue-toastification';
import draggable from 'vuedraggable';
import { todoService } from '../../services/todoService.js';
// WebSocket removido
import TodoItem from './TodoItem.vue';
import Modal from '../common/Modal.vue';
import Button from '../common/Button.vue';
import Input from '../common/Input.vue';

const props = defineProps({
  tarefaId: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['todos-updated']);

const toast = useToast();

const todos = ref([]);
const showModal = ref(false);
const editingTodo = ref(null);
const form = ref({ descricao: '' });
const errors = ref({});
const newTodoDescricao = ref('');

const todosConcluidos = computed(() => {
  return todos.value.filter(t => t.concluido).length;
});

const loadTodos = async () => {
  try {
    const loadedTodos = await todoService.getByTarefa(props.tarefaId);
    // Ordenar ao carregar: pendentes primeiro, depois concluídos, respeitando ordem
    todos.value = loadedTodos.sort((a, b) => {
      if (a.concluido !== b.concluido) {
        return a.concluido ? 1 : -1;
      }
      if (a.ordem !== undefined && b.ordem !== undefined) {
        return a.ordem - b.ordem;
      }
      return new Date(a.created_at) - new Date(b.created_at);
    });
  } catch (error) {
    toast.error('Erro ao carregar todos');
  }
};

watch(() => props.tarefaId, (newId) => {
  if (newId) {
    loadTodos();
  }
}, { immediate: true });

// WebSocket removido - atualizações são feitas via polling ou refresh manual
onMounted(() => {
  // WebSocket desabilitado
});

const addTodo = async () => {
  if (!newTodoDescricao.value.trim()) {
    return;
  }

  try {
    await todoService.create(props.tarefaId, { descricao: newTodoDescricao.value.trim() });
    newTodoDescricao.value = '';
    // WebSocket vai atualizar automaticamente via evento 'todo-created'
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao criar todo');
    console.error('Erro ao criar todo:', error);
  }
};

const openModal = (todo = null) => {
  // Limpar estado anterior
  editingTodo.value = null;
  form.value = { descricao: '' };
  errors.value = {};
  
  // Se for edição, preencher os dados
  if (todo && todo.id) {
    editingTodo.value = todo;
    form.value = { descricao: todo.descricao };
  }
  
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingTodo.value = null;
  form.value = { descricao: '' };
  errors.value = {};
};

const saveTodo = async () => {
  if (!form.value.descricao.trim()) {
    errors.value.descricao = 'Descrição é obrigatória';
    return;
  }

  try {
    await todoService.update(editingTodo.value.id, form.value);
    toast.success('Todo atualizado com sucesso!');
    closeModal();
    // WebSocket vai atualizar automaticamente via evento 'todo-updated'
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao atualizar todo');
    console.error('Erro ao atualizar todo:', error);
  }
};

const editTodo = (todo) => {
  openModal(todo);
};

const deleteTodo = async (id) => {
  if (!confirm('Tem certeza que deseja excluir este todo?')) {
    return;
  }

  try {
    await todoService.delete(id);
    toast.success('Todo excluído com sucesso!');
    // WebSocket vai atualizar automaticamente via evento 'todo-deleted'
  } catch (error) {
    toast.error('Erro ao excluir todo');
  }
};

const updateTodo = (updatedTodo) => {
  const index = todos.value.findIndex(t => t.id === updatedTodo.id);
  if (index !== -1) {
    // Atualizar o item na lista de forma reativa
    todos.value[index] = { ...updatedTodo };
    // Emitir evento para atualizar contadores externos
    emit('todos-updated');
  }
  // WebSocket vai atualizar automaticamente via evento 'todo-updated'
};

const marcarTodosConcluidos = async () => {
  const pendentes = todos.value.filter(t => !t.concluido);
  
  if (pendentes.length === 0) return;
  
  // Atualização otimista - atualizar UI imediatamente
  pendentes.forEach(todo => {
    const index = todos.value.findIndex(t => t.id === todo.id);
    if (index !== -1) {
      todos.value[index] = { ...todo, concluido: true };
    }
  });
  
  try {
    const promises = pendentes.map(todo =>
      todoService.update(todo.id, { concluido: true })
    );
    await Promise.all(promises);
    toast.success('Todos marcados como concluídos!');
    // WebSocket vai atualizar automaticamente via eventos 'todo-updated'
  } catch (error) {
    // Reverter em caso de erro - recarregar apenas em caso de erro
    loadTodos();
    toast.error('Erro ao marcar todos como concluídos');
  }
};

const desmarcarTodosConcluidos = async () => {
  const concluidos = todos.value.filter(t => t.concluido);
  
  if (concluidos.length === 0) return;
  
  // Atualização otimista - atualizar UI imediatamente
  concluidos.forEach(todo => {
    const index = todos.value.findIndex(t => t.id === todo.id);
    if (index !== -1) {
      todos.value[index] = { ...todo, concluido: false };
    }
  });
  
  try {
    const promises = concluidos.map(todo =>
      todoService.update(todo.id, { concluido: false })
    );
    await Promise.all(promises);
    toast.success('Todos desmarcados!');
    // WebSocket vai atualizar automaticamente via eventos 'todo-updated'
  } catch (error) {
    // Reverter em caso de erro - recarregar apenas em caso de erro
    loadTodos();
    toast.error('Erro ao desmarcar todos');
  }
};

const onDragEnd = async () => {
  try {
    // Verificar se os todos têm campo ordem (se não tiver, a migration não foi executada)
    const temOrdem = todos.value.some(todo => todo.ordem !== undefined);
    
    if (!temOrdem) {
      // Se não tem ordem, apenas recarregar sem salvar
      toast.info('Execute a migration para habilitar drag and drop');
      await loadTodos();
      return;
    }
    
    // Atualizar ordem de cada todo baseado na nova posição
    const todosOrdenados = todos.value.map((todo, index) => ({
      id: todo.id,
      ordem: index + 1
    }));
    
    await todoService.reorderTodos(props.tarefaId, todosOrdenados);
    toast.success('Ordem atualizada!');
    // WebSocket vai atualizar automaticamente via evento 'todos-reordered'
  } catch (error) {
    console.error('Erro ao reordenar todos:', error);
    toast.error('Erro ao reordenar todos');
    // Reverter mudanças apenas em caso de erro
    await loadTodos();
  }
};
</script>

<style scoped>
.todo-list {
  margin-top: 1.5rem;
}

.add-todo-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.add-todo-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.add-todo-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.add-todo-button {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 1.5rem;
  font-weight: 300;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.add-todo-button:hover:not(:disabled) {
  background-color: #4338ca;
}

.add-todo-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.todo-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.todo-list-header h4 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.todo-progress {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--primary-color);
  padding: 0.25rem 0.75rem;
  background-color: rgba(79, 70, 229, 0.1);
  border-radius: 9999px;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.btn-outline-gray {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-outline-gray:hover {
  background-color: #e5e7eb;
  border-color: #9ca3af;
}

.todo-items {
  display: flex;
  flex-direction: column;
}

.todo-item-wrapper {
  margin-bottom: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-light);
  font-size: 0.875rem;
}

/* Animações para transições */
.todo-list-enter-active,
.todo-list-leave-active {
  transition: all 0.3s ease;
}

.todo-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.todo-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.todo-list-move {
  transition: transform 0.3s ease;
}
</style>
