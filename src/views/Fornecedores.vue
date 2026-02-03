<template>
  <div class="fornecedores-page">
    <div class="page-header">
      <h1 class="page-title">Fornecedores</h1>
      <Button @click="openModal">+ Novo Fornecedor</Button>
    </div>

    <Loading v-if="loading" />
    <div v-else-if="fornecedores.length === 0" class="empty-state">
      <p>Nenhum fornecedor cadastrado.</p>
    </div>
    <div v-else class="fornecedores-list">
      <div v-for="fornecedor in fornecedores" :key="fornecedor.id" class="fornecedor-card">
        <div class="card-header">
          <div>
            <h3>{{ fornecedor.nome }}</h3>
            <span v-if="!fornecedor.ativo" class="inactive-badge">Inativo</span>
          </div>
          <div class="card-actions">
            <button class="btn btn-sm btn-outline" @click="editFornecedor(fornecedor)">
              Editar
            </button>
            <button class="btn btn-sm btn-danger" @click="deleteFornecedor(fornecedor.id)">
              Excluir
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="info-row" v-if="fornecedor.cnpj">
            <span class="label">CNPJ:</span>
            <span class="value">{{ fornecedor.cnpj }}</span>
          </div>
          <div class="info-row" v-if="fornecedor.telefone">
            <span class="label">Telefone:</span>
            <span class="value">{{ fornecedor.telefone }}</span>
          </div>
          <div class="info-row" v-if="fornecedor.email">
            <span class="label">Email:</span>
            <span class="value">{{ fornecedor.email }}</span>
          </div>
          <div class="info-row" v-if="fornecedor.contato">
            <span class="label">Contato:</span>
            <span class="value">{{ fornecedor.contato }}</span>
          </div>
          <div class="info-row" v-if="fornecedor.avaliacao > 0">
            <span class="label">Avaliação:</span>
            <span class="value">{{ fornecedor.avaliacao }}/5</span>
          </div>
        </div>
      </div>
    </div>

    <Offcanvas
      v-model:show="showModal"
      :title="editingFornecedor && editingFornecedor.id ? 'Editar Fornecedor' : 'Novo Fornecedor'"
      position="right"
      @confirm="saveFornecedor"
      @close="closeModal"
    >
      <form @submit.prevent="saveFornecedor" class="form">
        <Input
          id="nome"
          v-model="form.nome"
          label="Nome *"
          placeholder="Nome do fornecedor"
          :error="errors.nome"
          required
        />
        <Input
          id="cnpj"
          v-model="form.cnpj"
          label="CNPJ"
          placeholder="00.000.000/0000-00"
        />
        <Input
          id="telefone"
          v-model="form.telefone"
          label="Telefone"
          placeholder="(00) 00000-0000"
        />
        <Input
          id="email"
          v-model="form.email"
          label="Email"
          type="email"
          placeholder="email@exemplo.com"
        />
        <Input
          id="contato"
          v-model="form.contato"
          label="Contato"
          placeholder="Nome do contato"
        />
        <div class="input-group">
          <label for="endereco" class="input-label">Endereço</label>
          <textarea
            id="endereco"
            v-model="form.endereco"
            class="input"
            rows="2"
            placeholder="Endereço completo..."
          ></textarea>
        </div>
        <div class="input-group">
          <label for="avaliacao" class="input-label">Avaliação (0-5)</label>
          <input
            type="number"
            id="avaliacao"
            v-model.number="form.avaliacao"
            class="input"
            min="0"
            max="5"
            step="0.1"
          />
        </div>
        <div class="input-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.ativo" />
            Ativo
          </label>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="saveFornecedor">Salvar</button>
      </template>
    </Offcanvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { fornecedorService } from '../services/fornecedorService.js';
import Offcanvas from '../components/common/Offcanvas.vue';
import Loading from '../components/common/Loading.vue';
import Button from '../components/common/Button.vue';
import Input from '../components/common/Input.vue';

const toast = useToast();

const loading = ref(false);
const fornecedores = ref([]);
const showModal = ref(false);
const editingFornecedor = ref(null);
const errors = ref({});
const form = ref({
  nome: '',
  cnpj: '',
  telefone: '',
  email: '',
  endereco: '',
  contato: '',
  avaliacao: 0,
  ativo: true
});

const loadFornecedores = async () => {
  loading.value = true;
  try {
    const data = await fornecedorService.getAll();
    fornecedores.value = data;
  } catch (error) {
    toast.error('Erro ao carregar fornecedores');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const openModal = () => {
  editingFornecedor.value = null;
  form.value = {
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    contato: '',
    avaliacao: 0,
    ativo: true
  };
  errors.value = {};
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingFornecedor.value = null;
  form.value = {
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    contato: '',
    avaliacao: 0,
    ativo: true
  };
  errors.value = {};
};

const editFornecedor = (fornecedor) => {
  editingFornecedor.value = fornecedor;
  form.value = { ...fornecedor };
  showModal.value = true;
};

const saveFornecedor = async () => {
  try {
    if (editingFornecedor.value && editingFornecedor.value.id) {
      await fornecedorService.update(editingFornecedor.value.id, form.value);
      toast.success('Fornecedor atualizado com sucesso!');
    } else {
      await fornecedorService.create(form.value);
      toast.success('Fornecedor criado com sucesso!');
    }
    closeModal();
    loadFornecedores();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao salvar fornecedor');
  }
};

const deleteFornecedor = async (id) => {
  if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;
  try {
    await fornecedorService.delete(id);
    toast.success('Fornecedor excluído com sucesso!');
    loadFornecedores();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao excluir fornecedor');
  }
};

onMounted(() => {
  loadFornecedores();
});
</script>

<style scoped>
.fornecedores-page {
  padding: 2rem;
}


.fornecedores-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.fornecedor-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.inactive-badge {
  display: inline-block;
  background: #fee2e2;
  color: #dc2626;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  color: #6b7280;
  font-size: 0.875rem;
}

.info-row .value {
  font-weight: 500;
  color: #111827;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
