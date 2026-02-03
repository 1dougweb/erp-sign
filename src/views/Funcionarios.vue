<template>
  <div class="funcionarios-page">
    <div class="page-header">
      <h1 class="page-title">Funcionários</h1>
      <Button @click="openModal">+ Novo Funcionário</Button>
    </div>

    <Loading v-if="loading" />
    <div v-else-if="funcionarios.length === 0" class="empty-state">
      <p>Nenhum funcionário cadastrado. Cadastre o primeiro!</p>
    </div>
    <div v-else class="funcionarios-list">
      <div v-for="funcionario in funcionarios" :key="funcionario.id" class="funcionario-card">
        <div class="funcionario-info">
          <h3>{{ funcionario.nome }}</h3>
          <p v-if="funcionario.cargo">{{ funcionario.cargo }}</p>
          <div class="funcionario-contacts">
            <span v-if="funcionario.email">📧 {{ funcionario.email }}</span>
            <span v-if="funcionario.telefone">📞 {{ funcionario.telefone }}</span>
          </div>
          <span :class="['status-badge', funcionario.ativo ? 'status-active' : 'status-inactive']">
            {{ funcionario.ativo ? 'Ativo' : 'Inativo' }}
          </span>
        </div>
        <div class="funcionario-actions">
          <button class="btn btn-outline" @click="editFuncionario(funcionario)">Editar</button>
          <button class="btn btn-danger" @click="deleteFuncionario(funcionario.id)">Excluir</button>
        </div>
      </div>
    </div>

    <Offcanvas
      v-model:show="showModal"
      :title="editingFuncionario && editingFuncionario.id ? 'Editar Funcionário' : 'Novo Funcionário'"
      position="right"
      @confirm="saveFuncionario"
      @close="closeModal"
    >
      <form @submit.prevent="saveFuncionario" class="form">
        <Input
          id="nome"
          v-model="form.nome"
          label="Nome *"
          placeholder="Nome completo"
          :error="errors.nome"
          required
        />
        <Input
          id="email"
          v-model="form.email"
          label="Email"
          type="email"
          placeholder="email@exemplo.com"
        />
        <Input
          id="telefone"
          v-model="form.telefone"
          label="Telefone"
          placeholder="(00) 00000-0000"
        />
        <Input
          id="cargo"
          v-model="form.cargo"
          label="Cargo"
          placeholder="Ex: Instalador, Técnico"
        />
        <div class="input-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.ativo" />
            Ativo
          </label>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="saveFuncionario">Salvar</button>
      </template>
    </Offcanvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { funcionarioService } from '../services/funcionarioService.js';
import Offcanvas from '../components/common/Offcanvas.vue';
import Button from '../components/common/Button.vue';
import Input from '../components/common/Input.vue';
import Loading from '../components/common/Loading.vue';

const toast = useToast();

const funcionarios = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editingFuncionario = ref(null);
const form = ref({
  nome: '',
  email: '',
  telefone: '',
  cargo: '',
  ativo: true
});
const errors = ref({});

// Limpar estado quando o modal fechar
watch(showModal, (newValue) => {
  if (!newValue) {
    editingFuncionario.value = null;
    form.value = { nome: '', email: '', telefone: '', cargo: '', ativo: true };
    errors.value = {};
  }
});

onMounted(() => {
  loadFuncionarios();
});

const loadFuncionarios = async () => {
  try {
    loading.value = true;
    funcionarios.value = await funcionarioService.getAll();
  } catch (error) {
    toast.error('Erro ao carregar funcionários');
  } finally {
    loading.value = false;
  }
};

const openModal = (funcionario = null) => {
  // Limpar estado anterior
  editingFuncionario.value = null;
  form.value = { nome: '', email: '', telefone: '', cargo: '', ativo: true };
  errors.value = {};
  
  // Se for edição, preencher os dados
  if (funcionario && funcionario.id) {
    editingFuncionario.value = funcionario;
    form.value = { ...funcionario };
  }
  
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingFuncionario.value = null;
  form.value = { nome: '', email: '', telefone: '', cargo: '', ativo: true };
  errors.value = {};
};

const saveFuncionario = async () => {
  if (!form.value.nome.trim()) {
    errors.value.nome = 'Nome é obrigatório';
    return;
  }

  try {
    // Verificar se é edição (deve ter id válido)
    if (editingFuncionario.value && editingFuncionario.value.id) {
      await funcionarioService.update(editingFuncionario.value.id, form.value);
      toast.success('Funcionário atualizado com sucesso!');
    } else {
      await funcionarioService.create(form.value);
      toast.success('Funcionário criado com sucesso!');
    }
    closeModal();
    loadFuncionarios();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao salvar funcionário');
    console.error('Erro ao salvar funcionário:', error);
  }
};

const editFuncionario = (funcionario) => {
  openModal(funcionario);
};

const deleteFuncionario = async (id) => {
  if (!confirm('Tem certeza que deseja excluir este funcionário?')) {
    return;
  }

  try {
    await funcionarioService.delete(id);
    toast.success('Funcionário excluído com sucesso!');
    loadFuncionarios();
  } catch (error) {
    toast.error('Erro ao excluir funcionário');
  }
};
</script>

<style scoped>
.funcionarios-page {
  max-width: 1200px;
}


.funcionarios-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.funcionario-card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.funcionario-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.funcionario-info p {
  color: var(--text-light);
  margin: 0 0 0.75rem 0;
}

.funcionario-contacts {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-light);
  margin-bottom: 0.75rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-active {
  background-color: #d1fae5;
  color: #065f46;
}

.status-inactive {
  background-color: #fee2e2;
  color: #991b1b;
}

.funcionario-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-light);
}

@media (max-width: 768px) {
  .funcionarios-list {
    grid-template-columns: 1fr;
  }
}
</style>
