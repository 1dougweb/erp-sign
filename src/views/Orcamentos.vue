<template>
  <div class="orcamentos-page">
    <div class="page-header">
      <h1 class="page-title">Orçamentos</h1>
      <Button @click="openModal">+ Novo Orçamento</Button>
    </div>

    <Loading v-if="loading" />
    <div v-else-if="orcamentos.length === 0" class="empty-state">
      <p>Nenhum orçamento cadastrado. Crie o primeiro!</p>
    </div>
    <div v-else class="orcamentos-list">
      <div v-for="orcamento in orcamentos" :key="orcamento.id" class="orcamento-card">
        <div class="orcamento-header">
          <div>
            <h3>Orçamento {{ orcamento.numero }}</h3>
            <p class="orcamento-cliente">{{ orcamento.cliente_nome }}</p>
            <p v-if="orcamento.tipo_trabalho" class="orcamento-tipo">
              Tipo: {{ orcamento.tipo_trabalho }}
            </p>
          </div>
          <div class="orcamento-actions">
            <span :class="['status-badge', getStatusClass(orcamento.status)]">
              {{ getStatusLabel(orcamento.status) }}
            </span>
            <div class="orcamento-valor">
              <span class="valor-label">Total:</span>
              <span class="valor-amount">R$ {{ formatCurrency(orcamento.valor_calculado || orcamento.valor || 0) }}</span>
            </div>
            <button class="btn btn-outline" @click="editOrcamento(orcamento)">Editar</button>
            <button class="btn btn-danger" @click="deleteOrcamento(orcamento.id)">Excluir</button>
          </div>
        </div>
        <div class="orcamento-info">
          <p v-if="orcamento.cliente_endereco">
            <strong>Endereço:</strong> {{ orcamento.cliente_endereco }}
          </p>
          <div v-if="orcamento.itens && orcamento.itens.length > 0" class="orcamento-itens">
            <strong>Itens ({{ orcamento.itens.length }}):</strong>
            <ul class="itens-list">
              <li v-for="item in orcamento.itens" :key="item.id">
                {{ item.material_nome }} - {{ item.metragem_cm2 }} cm² - 
                R$ {{ formatCurrency(item.valor_total) }}
              </li>
            </ul>
          </div>
          <p v-if="orcamento.observacoes" class="orcamento-observacoes">
            <strong>Observações:</strong> {{ orcamento.observacoes }}
          </p>
        </div>
      </div>
    </div>

    <Offcanvas
      v-model:show="showModal"
      :title="editingOrcamento && editingOrcamento.id ? 'Editar Orçamento' : 'Novo Orçamento'"
      position="right"
      @confirm="saveOrcamento"
      @close="closeModal"
    >
      <form @submit.prevent="saveOrcamento" class="form">
        <div class="form-row">
          <Input
            id="numero"
            v-model="form.numero"
            label="Número do Orçamento *"
            placeholder="Ex: ORC-2024-001"
            :error="errors.numero"
            required
          />
          <Input
            id="cliente_nome"
            v-model="form.cliente_nome"
            label="Nome do Cliente *"
            placeholder="Nome completo"
            :error="errors.cliente_nome"
            required
          />
        </div>
        
        <Input
          id="cliente_endereco"
          v-model="form.cliente_endereco"
          label="Endereço"
          placeholder="Endereço completo"
        />
        
        <Input
          id="tipo_trabalho"
          v-model="form.tipo_trabalho"
          label="Tipo de Trabalho"
          placeholder="Ex: Impressão de banners"
        />
        
        <div class="input-group">
          <label for="status" class="input-label">Status</label>
          <select id="status" v-model="form.status" class="input">
            <option value="pendente">Pendente</option>
            <option value="aprovado">Aprovado</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        
        <div class="input-group">
          <label for="observacoes" class="input-label">Observações</label>
          <textarea
            id="observacoes"
            v-model="form.observacoes"
            class="textarea"
            rows="3"
            placeholder="Observações adicionais..."
          ></textarea>
        </div>
        
        <div class="itens-section">
          <div class="itens-header">
            <h4>Itens do Orçamento</h4>
            <Button type="button" @click="addItem" class="btn-small">+ Adicionar Item</Button>
          </div>
          
          <div v-if="form.itens.length === 0" class="empty-itens">
            <p>Nenhum item adicionado. Adicione pelo menos um item.</p>
          </div>
          
          <OrcamentoItemForm
            v-for="(item, index) in form.itens"
            :key="index"
            :item="item"
            :materiais="materiais"
            :index="index"
            :show-remove="form.itens.length > 1"
            :errors="getItemErrors(index)"
            @update:item="updateItem(index, $event)"
            @remove="removeItem(index)"
          />
        </div>
        
        <div class="total-section">
          <div class="total-row">
            <span class="total-label">Total do Orçamento:</span>
            <span class="total-value">R$ {{ formatCurrency(totalOrcamento) }}</span>
          </div>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="saveOrcamento">Salvar</button>
      </template>
    </Offcanvas>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { orcamentoService } from '../services/orcamentoService.js';
import { materialService } from '../services/materialService.js';
import OrcamentoItemForm from '../components/orcamento/OrcamentoItemForm.vue';
import Offcanvas from '../components/common/Offcanvas.vue';
import Button from '../components/common/Button.vue';
import Input from '../components/common/Input.vue';
import Loading from '../components/common/Loading.vue';

const toast = useToast();

const orcamentos = ref([]);
const materiais = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editingOrcamento = ref(null);
const form = ref({
  numero: '',
  cliente_nome: '',
  cliente_endereco: '',
  tipo_trabalho: '',
  observacoes: '',
  status: 'pendente',
  itens: []
});
const errors = ref({});

onMounted(() => {
  loadData();
});

const loadData = async () => {
  try {
    loading.value = true;
    const [orcamentosData, materiaisData] = await Promise.all([
      orcamentoService.getAll(),
      materialService.getAll()
    ]);
    orcamentos.value = orcamentosData;
    materiais.value = materiaisData;
  } catch (error) {
    toast.error('Erro ao carregar dados');
  } finally {
    loading.value = false;
  }
};

const totalOrcamento = computed(() => {
  return form.value.itens.reduce((sum, item) => {
    return sum + parseFloat(item.valor_total || 0);
  }, 0);
});

const formatCurrency = (value) => {
  return parseFloat(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const getStatusLabel = (status) => {
  const labels = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado'
  };
  return labels[status] || status;
};

const getStatusClass = (status) => {
  const classes = {
    pendente: 'status-pendente',
    aprovado: 'status-aprovado',
    em_andamento: 'status-em-andamento',
    concluido: 'status-concluido',
    cancelado: 'status-cancelado'
  };
  return classes[status] || '';
};

const openModal = (orcamento = null) => {
  editingOrcamento.value = null;
  form.value = {
    numero: '',
    cliente_nome: '',
    cliente_endereco: '',
    tipo_trabalho: '',
    observacoes: '',
    status: 'pendente',
    itens: []
  };
  errors.value = {};
  
  if (orcamento && orcamento.id) {
    editingOrcamento.value = orcamento;
    form.value = {
      numero: orcamento.numero,
      cliente_nome: orcamento.cliente_nome,
      cliente_endereco: orcamento.cliente_endereco || '',
      tipo_trabalho: orcamento.tipo_trabalho || '',
      observacoes: orcamento.observacoes || '',
      status: orcamento.status,
      itens: orcamento.itens ? orcamento.itens.map(item => ({
        material_id: item.material_id,
        descricao_trabalho: item.descricao_trabalho || '',
        metragem_cm2: item.metragem_cm2 || 0,
        valor_unitario: item.valor_unitario || 0,
        valor_total: item.valor_total || 0
      })) : []
    };
  }
  
  // Se não tiver itens, adicionar um vazio
  if (form.value.itens.length === 0) {
    addItem();
  }
  
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingOrcamento.value = null;
  form.value = {
    numero: '',
    cliente_nome: '',
    cliente_endereco: '',
    tipo_trabalho: '',
    observacoes: '',
    status: 'pendente',
    itens: []
  };
  errors.value = {};
};

const addItem = () => {
  form.value.itens.push({
    material_id: null,
    descricao_trabalho: '',
    metragem_cm2: 0,
    valor_unitario: 0,
    valor_total: 0
  });
};

const removeItem = (index) => {
  form.value.itens.splice(index, 1);
};

const updateItem = (index, item) => {
  form.value.itens[index] = { ...item };
};

const getItemErrors = (index) => {
  return errors.value[`itens.${index}`] || {};
};

const validateForm = () => {
  errors.value = {};
  let isValid = true;
  
  if (!form.value.numero.trim()) {
    errors.value.numero = 'Número do orçamento é obrigatório';
    isValid = false;
  }
  
  if (!form.value.cliente_nome.trim()) {
    errors.value.cliente_nome = 'Nome do cliente é obrigatório';
    isValid = false;
  }
  
  if (form.value.itens.length === 0) {
    errors.value.itens = 'Adicione pelo menos um item ao orçamento';
    isValid = false;
  }
  
  form.value.itens.forEach((item, index) => {
    if (!item.material_id) {
      errors.value[`itens.${index}`] = { material_id: 'Material é obrigatório' };
      isValid = false;
    }
    
    if (!item.metragem_cm2 || item.metragem_cm2 <= 0) {
      errors.value[`itens.${index}`] = {
        ...errors.value[`itens.${index}`],
        metragem_cm2: 'Metragem deve ser maior que zero'
      };
      isValid = false;
    }
  });
  
  return isValid;
};

const saveOrcamento = async () => {
  if (!validateForm()) {
    toast.error('Por favor, corrija os erros no formulário');
    return;
  }
  
  try {
    const orcamentoData = {
      ...form.value,
      itens: form.value.itens.map(item => ({
        material_id: item.material_id,
        descricao_trabalho: item.descricao_trabalho || null,
        metragem_cm2: parseFloat(item.metragem_cm2 || 0),
        valor_unitario: parseFloat(item.valor_unitario || 0),
        valor_total: parseFloat(item.valor_total || 0)
      }))
    };
    
    if (editingOrcamento.value && editingOrcamento.value.id) {
      await orcamentoService.update(editingOrcamento.value.id, orcamentoData);
      toast.success('Orçamento atualizado com sucesso!');
    } else {
      await orcamentoService.create(orcamentoData);
      toast.success('Orçamento criado com sucesso!');
    }
    
    closeModal();
    loadData();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao salvar orçamento');
    console.error('Erro ao salvar orçamento:', error);
  }
};

const editOrcamento = (orcamento) => {
  openModal(orcamento);
};

const deleteOrcamento = async (id) => {
  if (!confirm('Tem certeza que deseja excluir este orçamento?')) {
    return;
  }
  
  try {
    await orcamentoService.delete(id);
    toast.success('Orçamento excluído com sucesso!');
    loadData();
  } catch (error) {
    toast.error('Erro ao excluir orçamento');
  }
};
</script>

<style scoped>
.orcamentos-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-color);
}

.orcamentos-list {
  display: grid;
  gap: 1.5rem;
}

.orcamento-card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.orcamento-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.orcamento-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--text-color);
}

.orcamento-cliente {
  color: var(--text-light);
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.orcamento-tipo {
  color: var(--text-light);
  font-size: 0.875rem;
}

.orcamento-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.orcamento-valor {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.valor-label {
  font-size: 0.75rem;
  color: var(--text-light);
}

.valor-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-color);
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-pendente {
  background-color: rgba(251, 191, 36, 0.1);
  color: #f59e0b;
}

.status-aprovado {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.status-em-andamento {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.status-concluido {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.status-cancelado {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.orcamento-info {
  margin-top: 1rem;
}

.orcamento-itens {
  margin-top: 1rem;
}

.itens-list {
  margin-top: 0.5rem;
  padding-left: 1.5rem;
  color: var(--text-light);
  font-size: 0.875rem;
}

.orcamento-observacoes {
  margin-top: 1rem;
  color: var(--text-light);
  font-size: 0.875rem;
}

.itens-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid var(--border-color);
}

.itens-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.itens-header h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
}

.empty-itens {
  text-align: center;
  padding: 2rem;
  color: var(--text-light);
  background-color: var(--bg-color);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.total-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border-color);
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
}

.total-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.btn-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

@media (max-width: 768px) {
  .orcamentos-page {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .orcamento-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .orcamento-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
