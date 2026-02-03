<template>
  <div class="projetos-page">
    <div class="page-header">
      <h1 class="page-title">Projetos</h1>
      <Button @click="openModal">+ Novo Projeto</Button>
    </div>

    <Loading v-if="loading" />
    <div v-else-if="projetos.length === 0" class="empty-state">
      <p>Nenhum projeto encontrado. Crie seu primeiro projeto!</p>
    </div>
    <div v-else class="projetos-grid">
      <ProjetoCard
        v-for="projeto in projetos"
        :key="projeto.id"
        :projeto="projeto"
        @edit="editProjeto"
        @delete="deleteProjeto"
      />
    </div>

    <Offcanvas
      v-model:show="showModal"
      :title="editingProjeto && editingProjeto.id ? 'Editar Projeto' : 'Novo Projeto'"
      position="right"
      @confirm="saveProjeto"
      @close="closeModal"
    >
      <form @submit.prevent="saveProjeto" class="form">
        <Input
          id="nome"
          v-model="form.nome"
          label="Nome do Projeto *"
          placeholder="Ex: Projeto Alpha"
          :error="errors.nome"
          required
        />
        <div class="input-group">
          <label for="descricao" class="input-label">Descrição</label>
          <textarea
            id="descricao"
            v-model="form.descricao"
            class="input"
            placeholder="Descrição do projeto..."
            rows="4"
          ></textarea>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="saveProjeto">Salvar</button>
      </template>
    </Offcanvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { projetoService } from '../services/projetoService.js';
import ProjetoCard from '../components/todo/ProjetoCard.vue';
import Offcanvas from '../components/common/Offcanvas.vue';
import Button from '../components/common/Button.vue';
import Input from '../components/common/Input.vue';
import Loading from '../components/common/Loading.vue';

const toast = useToast();

const projetos = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editingProjeto = ref(null);
const form = ref({
  nome: '',
  descricao: ''
});
const errors = ref({});

// Limpar estado quando o modal fechar
watch(showModal, (newValue) => {
  if (!newValue) {
    editingProjeto.value = null;
    form.value = { nome: '', descricao: '' };
    errors.value = {};
  }
});

onMounted(() => {
  loadProjetos();
});

const loadProjetos = async () => {
  try {
    loading.value = true;
    projetos.value = await projetoService.getAll();
  } catch (error) {
    toast.error('Erro ao carregar projetos');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const openModal = (projeto = null) => {
  // Limpar estado anterior
  editingProjeto.value = null;
  form.value = { nome: '', descricao: '' };
  errors.value = {};
  
  // Se for edição, preencher os dados
  if (projeto && projeto.id) {
    editingProjeto.value = projeto;
    form.value = { nome: projeto.nome, descricao: projeto.descricao || '' };
  }
  
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingProjeto.value = null;
  form.value = { nome: '', descricao: '' };
  errors.value = {};
};

const saveProjeto = async () => {
  if (!form.value.nome.trim()) {
    errors.value.nome = 'Nome é obrigatório';
    return;
  }

  try {
    // Verificar se é edição (deve ter id válido)
    if (editingProjeto.value && editingProjeto.value.id) {
      await projetoService.update(editingProjeto.value.id, form.value);
      toast.success('Projeto atualizado com sucesso!');
    } else {
      await projetoService.create(form.value);
      toast.success('Projeto criado com sucesso!');
    }
    closeModal();
    loadProjetos();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao salvar projeto');
    console.error('Erro ao salvar projeto:', error);
  }
};

const editProjeto = (projeto) => {
  openModal(projeto);
};

const deleteProjeto = async (id) => {
  if (!confirm('Tem certeza que deseja excluir este projeto? Todas as tarefas serão excluídas também.')) {
    return;
  }

  try {
    await projetoService.delete(id);
    toast.success('Projeto excluído com sucesso!');
    loadProjetos();
  } catch (error) {
    toast.error('Erro ao excluir projeto');
  }
};
</script>

<style scoped>
.projetos-page {
  max-width: 1200px;
}

.projetos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .projetos-grid {
    grid-template-columns: 1fr;
  }
}
</style>
