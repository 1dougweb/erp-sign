<template>
  <div class="configuracoes-page">
    <div class="page-header">
      <h1 class="page-title">Configurações de Preços</h1>
      <p class="page-subtitle">Configure os valores por centímetro quadrado para cada material</p>
    </div>

    <Loading v-if="loading" />
    <div v-else-if="materiais.length === 0" class="empty-state">
      <p>Nenhum material cadastrado. Cadastre materiais primeiro!</p>
    </div>
    <div v-else class="configuracoes-list">
      <div v-for="material in materiais" :key="material.id" class="config-card">
        <div class="config-header">
          <div>
            <h3>{{ material.nome }}</h3>
            <p v-if="material.descricao" class="config-descricao">{{ material.descricao }}</p>
          </div>
        </div>
        
        <div class="config-content">
          <div v-if="getPrecoConfig(material.id)" class="preco-config">
            <div class="preco-info">
              <span class="preco-label">Valor por cm² (Impressão):</span>
              <span class="preco-value">R$ {{ formatCurrency(getPrecoConfig(material.id).valor_por_cm2) }}</span>
            </div>
            <div class="preco-status" :class="{ 'status-ativo': getPrecoConfig(material.id).ativo, 'status-inativo': !getPrecoConfig(material.id).ativo }">
              {{ getPrecoConfig(material.id).ativo ? 'Ativo' : 'Inativo' }}
            </div>
            <div class="preco-actions">
              <button class="btn btn-outline" @click="editPreco(material.id)">Editar</button>
              <button class="btn btn-danger" @click="deletePreco(getPrecoConfig(material.id).id)">Excluir</button>
            </div>
          </div>
          <div v-else class="preco-empty">
            <p>Nenhuma configuração de preço cadastrada</p>
            <button class="btn btn-primary" @click="openModal(material)">Configurar Preço</button>
          </div>
        </div>
      </div>
    </div>

    <Offcanvas
      v-model:show="showModal"
      :title="editingPreco ? 'Editar Configuração de Preço' : 'Nova Configuração de Preço'"
      position="right"
      @confirm="savePreco"
      @close="closeModal"
    >
      <form @submit.prevent="savePreco" class="form">
        <div class="input-group" v-if="!editingPreco">
          <label for="material_id" class="input-label">Material</label>
          <select
            id="material_id"
            v-model="form.material_id"
            class="input"
            :disabled="!!selectedMaterial"
          >
            <option :value="null">Selecione um material...</option>
            <option
              v-for="material in materiais"
              :key="material.id"
              :value="material.id"
            >
              {{ material.nome }}
            </option>
          </select>
        </div>
        <div v-else class="input-group">
          <label class="input-label">Material</label>
          <p class="input-readonly">{{ selectedMaterial?.nome || 'N/A' }}</p>
        </div>
        
        <div class="input-group">
          <label for="valor_por_cm2" class="input-label">Valor por cm² (R$)</label>
          <input
            id="valor_por_cm2"
            v-model.number="form.valor_por_cm2"
            type="number"
            step="0.0001"
            min="0"
            class="input"
            placeholder="0.0000"
            :error="errors.valor_por_cm2"
            required
          />
          <span v-if="errors.valor_por_cm2" class="error-message">{{ errors.valor_por_cm2 }}</span>
        </div>
        
        <div class="input-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.ativo" />
            Configuração Ativa
          </label>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="savePreco">Salvar</button>
      </template>
    </Offcanvas>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { materialService } from '../services/materialService.js';
import { materialPrecoService } from '../services/materialPrecoService.js';
import Offcanvas from '../components/common/Offcanvas.vue';
import Button from '../components/common/Button.vue';
import Loading from '../components/common/Loading.vue';

const toast = useToast();

const materiais = ref([]);
const precos = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editingPreco = ref(null);
const selectedMaterial = ref(null);
const form = ref({
  material_id: null,
  tipo_calculo: 'impressao_cm2',
  valor_por_cm2: 0,
  ativo: true
});
const errors = ref({});

onMounted(() => {
  loadData();
});

const loadData = async () => {
  try {
    loading.value = true;
    const [materiaisData, precosData] = await Promise.all([
      materialService.getAll(),
      materialPrecoService.getAll()
    ]);
    materiais.value = materiaisData;
    precos.value = precosData;
  } catch (error) {
    toast.error('Erro ao carregar dados');
  } finally {
    loading.value = false;
  }
};

const getPrecoConfig = (materialId) => {
  return precos.value.find(p => p.material_id === materialId && p.tipo_calculo === 'impressao_cm2');
};

const formatCurrency = (value) => {
  return parseFloat(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  });
};

const openModal = (material = null) => {
  editingPreco.value = null;
  selectedMaterial.value = material;
  form.value = {
    material_id: material ? material.id : null,
    tipo_calculo: 'impressao_cm2',
    valor_por_cm2: 0,
    ativo: true
  };
  errors.value = {};
  
  if (material) {
    const precoExistente = getPrecoConfig(material.id);
    if (precoExistente) {
      editingPreco.value = precoExistente;
      form.value = {
        material_id: material.id,
        tipo_calculo: precoExistente.tipo_calculo,
        valor_por_cm2: precoExistente.valor_por_cm2,
        ativo: precoExistente.ativo
      };
    }
  }
  
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingPreco.value = null;
  selectedMaterial.value = null;
  form.value = {
    material_id: null,
    tipo_calculo: 'impressao_cm2',
    valor_por_cm2: 0,
    ativo: true
  };
  errors.value = {};
};

const savePreco = async () => {
  errors.value = {};
  
  if (!form.value.material_id) {
    errors.value.material_id = 'Material é obrigatório';
    return;
  }
  
  if (!form.value.valor_por_cm2 || form.value.valor_por_cm2 <= 0) {
    errors.value.valor_por_cm2 = 'Valor por cm² deve ser maior que zero';
    return;
  }

  try {
    if (editingPreco.value && editingPreco.value.id) {
      await materialPrecoService.update(editingPreco.value.id, {
        valor_por_cm2: form.value.valor_por_cm2,
        ativo: form.value.ativo
      });
      toast.success('Configuração de preço atualizada com sucesso!');
    } else {
      await materialPrecoService.create({
        material_id: form.value.material_id,
        tipo_calculo: form.value.tipo_calculo,
        valor_por_cm2: form.value.valor_por_cm2,
        ativo: form.value.ativo
      });
      toast.success('Configuração de preço criada com sucesso!');
    }
    closeModal();
    loadData();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao salvar configuração de preço');
    console.error('Erro ao salvar configuração:', error);
  }
};

const editPreco = (materialId) => {
  const material = materiais.value.find(m => m.id === materialId);
  if (material) {
    openModal(material);
  }
};

const deletePreco = async (precoId) => {
  if (!confirm('Tem certeza que deseja excluir esta configuração de preço?')) {
    return;
  }

  try {
    await materialPrecoService.delete(precoId);
    toast.success('Configuração de preço excluída com sucesso!');
    loadData();
  } catch (error) {
    toast.error('Erro ao excluir configuração de preço');
  }
};
</script>

<style scoped>
.configuracoes-page {
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.page-subtitle {
  color: var(--text-light);
  font-size: 0.875rem;
}

.configuracoes-list {
  display: grid;
  gap: 1.5rem;
}

.config-card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.config-header {
  margin-bottom: 1rem;
}

.config-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--text-color);
}

.config-descricao {
  color: var(--text-light);
  font-size: 0.875rem;
}

.config-content {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.preco-config {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.preco-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.preco-label {
  font-size: 0.875rem;
  color: var(--text-light);
}

.preco-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
}

.preco-status {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-ativo {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.status-inativo {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.preco-actions {
  display: flex;
  gap: 0.5rem;
}

.preco-empty {
  text-align: center;
  padding: 1rem;
  color: var(--text-light);
}

.input-readonly {
  padding: 0.5rem;
  background-color: var(--bg-color);
  border-radius: 0.375rem;
  color: var(--text-color);
}

.error-message {
  color: var(--danger-color);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .configuracoes-page {
    padding: 1rem;
  }
  
  .preco-config {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
