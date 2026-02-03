<template>
  <div class="tarefas-page">
    <div class="page-header">
      <div>
        <button class="btn btn-outline" @click="$router.push('/projetos')">
          <ArrowLeftIcon class="btn-icon-inline" />
          Voltar
        </button>
        <h1 class="page-title">{{ projeto?.nome || 'Tarefas' }}</h1>
      </div>
      <Button @click="openModal">+ Nova Tarefa</Button>
    </div>

    <Loading v-if="loading" />
    <div v-else-if="!projeto" class="error-state">
      <p>Projeto não encontrado</p>
    </div>
    <div v-else>
      <draggable
        v-model="tarefas"
        :animation="200"
        handle=".tarefa-card"
        @end="onDragEnd"
        item-key="id"
        class="tarefas-list"
      >
        <template #item="{ element: tarefa }">
          <div class="tarefa-wrapper">
            <TarefaCard
              :tarefa="tarefa"
              :todos-count="getTodosCount(tarefa.id)"
              @edit="editTarefa"
              @delete="deleteTarefa"
              @view-todos="viewTodos"
            />
          </div>
        </template>
      </draggable>

      <div v-if="tarefas.length === 0" class="empty-state">
        <p>Nenhuma tarefa encontrada. Crie sua primeira tarefa!</p>
      </div>
    </div>

    <Offcanvas
      v-model:show="showModal"
      :title="editingTarefa && editingTarefa.id ? 'Editar Tarefa' : 'Nova Tarefa'"
      position="right"
      @confirm="saveTarefa"
      @close="closeModal"
    >
      <form @submit.prevent="saveTarefa" class="form">
        <Input
          id="titulo"
          v-model="form.titulo"
          label="Título *"
          placeholder="Ex: Implementar funcionalidade X"
          :error="errors.titulo"
          required
        />
        <div class="input-group">
          <label for="descricao" class="input-label">Descrição</label>
          <textarea
            id="descricao"
            v-model="form.descricao"
            class="input"
            placeholder="Descrição da tarefa..."
            rows="4"
          ></textarea>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="saveTarefa">Salvar</button>
      </template>
    </Offcanvas>

    <Offcanvas
      v-model:show="showTodosOffcanvas"
      :title="selectedTarefa ? `Todos - ${selectedTarefa.titulo}` : 'Todos'"
      position="right"
      :show-footer="false"
      @close="closeTodosOffcanvas"
    >
      <TodoList
        v-if="selectedTarefaId"
        :tarefa-id="selectedTarefaId"
        @todos-updated="updateTodosCount(selectedTarefaId)"
      />
    </Offcanvas>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';
import draggable from 'vuedraggable';
import { projetoService } from '../services/projetoService.js';
import { tarefaService } from '../services/tarefaService.js';
import { todoService } from '../services/todoService.js';
import TarefaCard from '../components/todo/TarefaCard.vue';
import TodoList from '../components/todo/TodoList.vue';
import Offcanvas from '../components/common/Offcanvas.vue';
import Button from '../components/common/Button.vue';
import Input from '../components/common/Input.vue';
import Loading from '../components/common/Loading.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const projeto = ref(null);
const tarefas = ref([]);
const todosCounts = ref({});
const loading = ref(true);
const showModal = ref(false);
const editingTarefa = ref(null);
const selectedTarefaId = ref(null);
const selectedTarefa = ref(null);
const showTodosOffcanvas = ref(false);
const form = ref({
  titulo: '',
  descricao: ''
});
const errors = ref({});

const projetoId = computed(() => parseInt(route.params.id));

// Limpar estado quando o modal fechar
watch(showModal, (newValue) => {
  if (!newValue) {
    editingTarefa.value = null;
    form.value = { titulo: '', descricao: '' };
    errors.value = {};
  }
});

onMounted(() => {
  loadData();
});

const loadData = async () => {
  try {
    loading.value = true;
    projeto.value = await projetoService.getAll().then(projetos => 
      projetos.find(p => p.id === projetoId.value)
    );

    if (!projeto.value) {
      return;
    }

    tarefas.value = await tarefaService.getByProjeto(projetoId.value);
    
    // Carregar contagem de todos para cada tarefa
    for (const tarefa of tarefas.value) {
      const todos = await todoService.getByTarefa(tarefa.id);
      todosCounts.value[tarefa.id] = todos.length;
    }
  } catch (error) {
    toast.error('Erro ao carregar dados');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const getTodosCount = (tarefaId) => {
  return todosCounts.value[tarefaId] || 0;
};

const openModal = (tarefa = null) => {
  // Limpar estado anterior
  editingTarefa.value = null;
  form.value = { titulo: '', descricao: '' };
  errors.value = {};
  
  // Se for edição, preencher os dados
  if (tarefa && tarefa.id) {
    editingTarefa.value = tarefa;
    form.value = { titulo: tarefa.titulo, descricao: tarefa.descricao || '' };
  }
  
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingTarefa.value = null;
  form.value = { titulo: '', descricao: '' };
  errors.value = {};
};

const saveTarefa = async () => {
  if (!form.value.titulo.trim()) {
    errors.value.titulo = 'Título é obrigatório';
    return;
  }

  try {
    // Verificar se é edição (deve ter id válido)
    if (editingTarefa.value && editingTarefa.value.id) {
      await tarefaService.update(editingTarefa.value.id, form.value);
      toast.success('Tarefa atualizada com sucesso!');
    } else {
      await tarefaService.create(projetoId.value, form.value);
      toast.success('Tarefa criada com sucesso!');
    }
    closeModal();
    loadData();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao salvar tarefa');
    console.error('Erro ao salvar tarefa:', error);
  }
};

const editTarefa = (tarefa) => {
  openModal(tarefa);
};

const deleteTarefa = async (id) => {
  if (!confirm('Tem certeza que deseja excluir esta tarefa? Todos os todos serão excluídos também.')) {
    return;
  }

  try {
    await tarefaService.delete(id);
    toast.success('Tarefa excluída com sucesso!');
    loadData();
  } catch (error) {
    toast.error('Erro ao excluir tarefa');
  }
};

const viewTodos = (tarefa) => {
  selectedTarefaId.value = tarefa.id;
  selectedTarefa.value = tarefa;
  showTodosOffcanvas.value = true;
  updateTodosCount(tarefa.id);
};

const closeTodosOffcanvas = () => {
  showTodosOffcanvas.value = false;
  selectedTarefaId.value = null;
  selectedTarefa.value = null;
};

const updateTodosCount = async (tarefaId) => {
  try {
    const todos = await todoService.getByTarefa(tarefaId);
    todosCounts.value[tarefaId] = todos.length;
  } catch (error) {
    console.error('Erro ao atualizar contagem de todos:', error);
  }
};

const onDragEnd = async () => {
  try {
    const tarefasOrdenadas = tarefas.value.map((t, index) => ({
      id: t.id,
      ordem: index + 1
    }));
    await tarefaService.reordenar(tarefasOrdenadas);
    toast.success('Tarefas reordenadas com sucesso!');
  } catch (error) {
    toast.error('Erro ao reordenar tarefas');
    loadData(); // Reverter mudanças
  }
};
</script>

<style scoped>
.tarefas-page {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.page-header > div:first-child {
  flex: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0.5rem 0 0 0;
  color: var(--text-color);
}

.tarefas-list {
  display: flex;
  flex-direction: column;
}

.tarefa-wrapper {
  margin-bottom: 1.5rem;
}

.empty-state,
.error-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-light);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.btn-icon-inline {
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
}
</style>
