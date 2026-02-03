<template>
  <div class="estoque-page">
    <div class="page-header">
      <h1 class="page-title">Estoque de Materiais</h1>
      <div class="header-actions">
        <button 
          class="btn btn-primary btn-icon" 
          @click="openModal()"
          v-if="authStore.isAdmin"
        >
          <PlusIcon class="icon" />
          <span>Adicionar Novo</span>
        </button>
        <router-link to="/estoque/movimentacoes" class="btn btn-outline">
          Movimentações
        </router-link>
        <router-link to="/estoque/relatorios" class="btn btn-outline" v-if="authStore.isAdmin">
          Relatórios
        </router-link>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-section">
      <div class="filters-grid">
        <Input
          id="busca"
          v-model="filters.busca"
          placeholder="Buscar por nome, descrição ou código..."
          @input="loadEstoque"
        />
        <select v-model="filters.categoria_id" @change="loadEstoque" class="input">
          <option value="">Todas as categorias</option>
          <option v-for="cat in categorias" :key="cat.id" :value="cat.id">
            {{ cat.nome }}
          </option>
        </select>
        <select v-model="filters.fornecedor_id" @change="loadEstoque" class="input">
          <option value="">Todos os fornecedores</option>
          <option v-for="forn in fornecedores" :key="forn.id" :value="forn.id">
            {{ forn.nome }}
          </option>
        </select>
        <label class="checkbox-label">
          <input type="checkbox" v-model="filters.estoque_baixo" @change="loadEstoque" />
          Apenas estoque baixo
        </label>
      </div>
    </div>

    <Loading v-if="loading" />
    <div v-else-if="materiais.length === 0" class="empty-state">
      <p>Nenhum material encontrado.</p>
    </div>
    <div v-else class="table-container">
      <table class="estoque-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Estoque</th>
            <th>Mínimo</th>
            <th>Unidade</th>
            <th>Fornecedor</th>
            <th>Valor Unitário</th>
            <th>Localização</th>
            <th>Status</th>
            <th class="actions-column">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="material in materiais"
            :key="material.id"
            :class="{
              'row-estoque-baixo': material.status_estoque === 'baixo',
              'row-estoque-zero': material.status_estoque === 'zero'
            }"
          >
            <td class="nome-cell">
              <div class="nome-content">
                <strong>{{ material.nome }}</strong>
                <span v-if="material.descricao" class="descricao-preview" :title="material.descricao">
                  {{ truncateText(material.descricao, 50) }}
                </span>
              </div>
            </td>
            <td>
              <span class="categoria-badge" v-if="material.categoria_nome">
                {{ material.categoria_nome }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td class="number-cell">
              {{ formatNumber(material.quantidade_estoque) }}
            </td>
            <td class="number-cell">
              {{ material.estoque_minimo > 0 ? formatNumber(material.estoque_minimo) : '-' }}
            </td>
            <td>
              {{ material.unidade_simbolo || material.unidade || 'un' }}
            </td>
            <td>
              {{ material.fornecedor_nome || '-' }}
            </td>
            <td class="number-cell">
              {{ material.valor_unitario > 0 ? `R$ ${formatNumber(material.valor_unitario, 2)}` : '-' }}
            </td>
            <td>
              {{ material.localizacao || '-' }}
            </td>
            <td>
              <span
                class="status-badge"
                :class="{
                  'status-zero': material.status_estoque === 'zero',
                  'status-baixo': material.status_estoque === 'baixo',
                  'status-normal': material.status_estoque === 'normal'
                }"
              >
                {{ getStatusLabel(material.status_estoque) }}
              </span>
            </td>
            <td class="actions-cell">
              <div class="table-actions">
                <button class="btn btn-sm btn-outline btn-icon" @click="viewDetails(material)" title="Ver detalhes">
                  <EyeIcon class="icon" />
                </button>
                <button
                  v-if="authStore.isAdmin"
                  class="btn btn-sm btn-outline btn-icon"
                  @click="editMaterial(material)"
                  title="Editar material"
                >
                  <PencilIcon class="icon" />
                </button>
                <button
                  v-if="authStore.isAdmin"
                  class="btn btn-sm btn-outline btn-icon btn-danger"
                  @click="confirmDeleteAction(material)"
                  title="Excluir material"
                >
                  <TrashIcon class="icon" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Offcanvas de Detalhes (somente leitura) -->
    <Offcanvas
      v-model:show="showDetailsModal"
      title="Detalhes do Material"
      position="right"
      @close="closeDetailsModal"
    >
      <div v-if="selectedMaterial" class="details-content">
        <div v-if="selectedMaterial.imagem_url" class="details-image">
          <img :src="selectedMaterial.imagem_url" :alt="selectedMaterial.nome" />
        </div>
        <div class="details-section">
          <h3 class="details-title">{{ selectedMaterial.nome }}</h3>
          <div v-if="selectedMaterial.categoria_nome" class="details-badge">
            {{ selectedMaterial.categoria_nome }}
          </div>
        </div>
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Status do Estoque:</span>
            <span
              class="detail-value status-badge"
              :class="{
                'status-zero': selectedMaterial.status_estoque === 'zero',
                'status-baixo': selectedMaterial.status_estoque === 'baixo',
                'status-normal': selectedMaterial.status_estoque === 'normal'
              }"
            >
              {{ getStatusLabel(selectedMaterial.status_estoque) }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Quantidade em Estoque:</span>
            <span class="detail-value">
              {{ formatNumber(selectedMaterial.quantidade_estoque) }}
              {{ selectedMaterial.unidade_simbolo || selectedMaterial.unidade || 'un' }}
            </span>
          </div>
          <div v-if="selectedMaterial.estoque_minimo > 0" class="detail-item">
            <span class="detail-label">Estoque Mínimo:</span>
            <span class="detail-value">
              {{ formatNumber(selectedMaterial.estoque_minimo) }}
              {{ selectedMaterial.unidade_simbolo || selectedMaterial.unidade || 'un' }}
            </span>
          </div>
          <div v-if="selectedMaterial.estoque_maximo > 0" class="detail-item">
            <span class="detail-label">Estoque Máximo:</span>
            <span class="detail-value">
              {{ formatNumber(selectedMaterial.estoque_maximo) }}
              {{ selectedMaterial.unidade_simbolo || selectedMaterial.unidade || 'un' }}
            </span>
          </div>
          <div v-if="selectedMaterial.fornecedor_nome" class="detail-item">
            <span class="detail-label">Fornecedor:</span>
            <span class="detail-value">{{ selectedMaterial.fornecedor_nome }}</span>
          </div>
          <div v-if="selectedMaterial.valor_unitario > 0" class="detail-item">
            <span class="detail-label">Valor Unitário:</span>
            <span class="detail-value">R$ {{ formatNumber(selectedMaterial.valor_unitario, 2) }}</span>
          </div>
          <div v-if="selectedMaterial.localizacao" class="detail-item">
            <span class="detail-label">Localização:</span>
            <span class="detail-value">{{ selectedMaterial.localizacao }}</span>
          </div>
          <div v-if="selectedMaterial.descricao" class="detail-item full-width">
            <span class="detail-label">Descrição:</span>
            <p class="detail-description">{{ selectedMaterial.descricao }}</p>
          </div>
        </div>

        <!-- Seção de Alimentar Item -->
        <div v-if="authStore.isAdmin" class="details-section-actions">
          <h4 class="section-title">Alimentar Estoque</h4>
          <form @submit.prevent="alimentarEstoque" class="alimentar-form">
            <div class="form-row">
              <Input
                id="quantidade_entrada"
                v-model.number="entradaForm.quantidade"
                label="Quantidade"
                type="number"
                min="0.01"
                step="0.01"
                required
                :error="entradaErrors.quantidade"
              />
              <Input
                id="valor_unitario_entrada"
                v-model.number="entradaForm.valor_unitario"
                label="Valor Unitário (R$)"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
            <div class="input-group">
              <label for="observacoes_entrada" class="input-label">Observações</label>
              <textarea
                id="observacoes_entrada"
                v-model="entradaForm.observacoes"
                class="input"
                rows="2"
                placeholder="Observações sobre a entrada..."
              ></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-icon" :disabled="loadingEntrada">
              <PlusIcon class="icon" />
              <span>Adicionar ao Estoque</span>
            </button>
          </form>
        </div>

        <!-- Histórico de Movimentações -->
        <div class="details-section-history">
          <div class="section-header">
            <h4 class="section-title">Histórico de Movimentações</h4>
            <button 
              class="btn btn-sm btn-outline" 
              @click="loadMovimentacoes"
              :disabled="loadingMovimentacoes"
            >
              Atualizar
            </button>
          </div>
          <Loading v-if="loadingMovimentacoes" />
          <div v-else-if="movimentacoes.length === 0" class="empty-history">
            <p>Nenhuma movimentação registrada.</p>
          </div>
          <div v-else class="movimentacoes-list">
            <div 
              v-for="mov in movimentacoes" 
              :key="mov.id" 
              class="movimentacao-item"
              :class="`movimentacao-${mov.tipo}`"
            >
              <div class="movimentacao-header">
                <span class="movimentacao-tipo">{{ getTipoLabel(mov.tipo) }}</span>
                <span class="movimentacao-data">{{ formatDate(mov.data_movimentacao) }}</span>
              </div>
              <div class="movimentacao-body">
                <div class="movimentacao-info">
                  <span class="label">Quantidade:</span>
                  <span class="value">
                    {{ formatNumber(mov.quantidade) }} 
                    {{ mov.unidade_simbolo || 'un' }}
                  </span>
                </div>
                <div v-if="mov.valor_total > 0" class="movimentacao-info">
                  <span class="label">Valor Total:</span>
                  <span class="value">R$ {{ formatNumber(mov.valor_total, 2) }}</span>
                </div>
                <div v-if="mov.usuario_nome" class="movimentacao-info">
                  <span class="label">Usuário:</span>
                  <span class="value">{{ mov.usuario_nome }}</span>
                </div>
                <div v-if="mov.observacoes" class="movimentacao-info">
                  <span class="label">Observações:</span>
                  <span class="value">{{ mov.observacoes }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeDetailsModal">Fechar</button>
        <button
          v-if="authStore.isAdmin"
          type="button"
          class="btn btn-primary btn-icon"
          @click="editFromDetails"
        >
          <PencilIcon class="icon" />
          <span>Editar</span>
        </button>
        <button
          v-if="authStore.isAdmin"
          type="button"
          class="btn btn-danger btn-icon"
          @click="confirmDeleteFromDetails"
        >
          <TrashIcon class="icon" />
          <span>Excluir</span>
        </button>
      </template>
    </Offcanvas>

    <!-- Offcanvas de Edição -->
    <Offcanvas
      v-model:show="showModal"
      :title="editingMaterial && editingMaterial.id ? 'Editar Material' : 'Novo Material'"
      position="right"
      @confirm="saveMaterial"
      @close="closeModal"
    >
      <form @submit.prevent="saveMaterial" class="form">
        <ImageUpload
          v-model="form.imagem_url"
          label="Imagem do Material"
        />
        <Input
          id="nome"
          v-model="form.nome"
          label="Nome *"
          placeholder="Ex: Parafuso 6mm"
          :error="errors.nome"
          required
        />
        <div class="input-group">
          <label for="descricao" class="input-label">Descrição</label>
          <textarea
            id="descricao"
            v-model="form.descricao"
            class="input"
            rows="3"
            placeholder="Descrição do material..."
          ></textarea>
        </div>
        <div class="form-row">
          <Input
            id="quantidade_estoque"
            v-model.number="form.quantidade_estoque"
            label="Quantidade em Estoque"
            type="number"
            min="0"
          />
          <Input
            id="unidade"
            v-model="form.unidade"
            label="Unidade"
            placeholder="Ex: un, kg, m"
          />
        </div>
        <div class="form-row">
          <Input
            id="estoque_minimo"
            v-model.number="form.estoque_minimo"
            label="Estoque Mínimo"
            type="number"
            min="0"
          />
          <Input
            id="localizacao"
            v-model="form.localizacao"
            label="Localização"
            placeholder="Ex: Prateleira A1"
          />
        </div>
        <div class="form-row">
          <Input
            id="valor_unitario"
            v-model.number="form.valor_unitario"
            label="Valor Unitário (R$)"
            type="number"
            step="0.01"
            min="0"
          />
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="saveMaterial">Salvar</button>
      </template>
    </Offcanvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '../store/auth.js';
import { estoqueService, categoriaService, movimentacaoService } from '../services/estoqueService.js';
import { fornecedorService } from '../services/fornecedorService.js';
import { materialService } from '../services/materialService.js';
import Offcanvas from '../components/common/Offcanvas.vue';
import Input from '../components/common/Input.vue';
import Loading from '../components/common/Loading.vue';
import ImageUpload from '../components/common/ImageUpload.vue';
import { EyeIcon, PencilIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { useConfirm } from '../composables/useConfirm.js';

const toast = useToast();
const authStore = useAuthStore();
const { confirmDelete } = useConfirm();

const loading = ref(false);
const materiais = ref([]);
const categorias = ref([]);
const fornecedores = ref([]);
const showModal = ref(false);
const showDetailsModal = ref(false);
const editingMaterial = ref(null);
const selectedMaterial = ref(null);
const movimentacoes = ref([]);
const loadingMovimentacoes = ref(false);
const loadingEntrada = ref(false);
const entradaForm = ref({
  quantidade: 0,
  valor_unitario: 0,
  observacoes: ''
});
const entradaErrors = ref({});
const form = ref({
  nome: '',
  descricao: '',
  quantidade_estoque: 0,
  unidade: '',
  estoque_minimo: 0,
  localizacao: '',
  valor_unitario: 0,
  imagem_url: ''
});
const errors = ref({});
const filters = ref({
  busca: '',
  categoria_id: '',
  fornecedor_id: '',
  estoque_baixo: false
});

// Limpar estado quando o modal fechar
watch(showModal, (newValue) => {
  if (!newValue) {
    editingMaterial.value = null;
    form.value = {
      nome: '',
      descricao: '',
      quantidade_estoque: 0,
      unidade: '',
      estoque_minimo: 0,
      localizacao: '',
      valor_unitario: 0,
      imagem_url: ''
    };
    errors.value = {};
  }
});

const loadEstoque = async () => {
  loading.value = true;
  try {
    const data = await estoqueService.getAll(filters.value);
    materiais.value = data;
  } catch (error) {
    toast.error('Erro ao carregar estoque');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const loadCategorias = async () => {
  try {
    const data = await categoriaService.getAll();
    categorias.value = data;
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
};

const loadFornecedores = async () => {
  try {
    const data = await fornecedorService.getAll();
    fornecedores.value = data;
  } catch (error) {
    console.error('Erro ao carregar fornecedores:', error);
  }
};

const getStatusLabel = (status) => {
  const labels = {
    zero: 'Estoque Zero',
    baixo: 'Estoque Baixo',
    normal: 'Normal'
  };
  return labels[status] || 'Normal';
};

const formatNumber = (value, decimals = 2) => {
  if (!value && value !== 0) return '0';
  return parseFloat(value).toFixed(decimals);
};

const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const viewDetails = (material) => {
  selectedMaterial.value = material;
  showDetailsModal.value = true;
  // Limpar formulário de entrada
  entradaForm.value = {
    quantidade: 0,
    valor_unitario: 0,
    observacoes: ''
  };
  entradaErrors.value = {};
  // Carregar movimentações
  if (material && material.id) {
    loadMovimentacoes();
  }
};

const closeDetailsModal = () => {
  showDetailsModal.value = false;
  selectedMaterial.value = null;
};

const editFromDetails = () => {
  if (selectedMaterial.value) {
    closeDetailsModal();
    openModal(selectedMaterial.value);
  }
};

const openModal = (material = null) => {
  // Limpar estado anterior
  editingMaterial.value = null;
  form.value = {
    nome: '',
    descricao: '',
    quantidade_estoque: 0,
    unidade: '',
    estoque_minimo: 0,
    localizacao: '',
    valor_unitario: 0,
    imagem_url: ''
  };
  errors.value = {};
  
  // Se for edição, preencher os dados
  if (material && material.id) {
    editingMaterial.value = material;
    form.value = {
      nome: material.nome || '',
      descricao: material.descricao || '',
      quantidade_estoque: material.quantidade_estoque || 0,
      unidade: material.unidade_simbolo || material.unidade || '',
      estoque_minimo: material.estoque_minimo || 0,
      localizacao: material.localizacao || '',
      valor_unitario: material.valor_unitario || 0,
      imagem_url: material.imagem_url || ''
    };
  }
  
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingMaterial.value = null;
  form.value = {
    nome: '',
    descricao: '',
    quantidade_estoque: 0,
    unidade: '',
    estoque_minimo: 0,
    localizacao: '',
    valor_unitario: 0,
    imagem_url: ''
  };
  errors.value = {};
};

const saveMaterial = async () => {
  if (!form.value.nome.trim()) {
    errors.value.nome = 'Nome é obrigatório';
    return;
  }

  try {
    // Verificar se é edição (deve ter id válido)
    if (editingMaterial.value && editingMaterial.value.id) {
      await materialService.update(editingMaterial.value.id, form.value);
      toast.success('Material atualizado com sucesso!');
    } else {
      await materialService.create({ ...form.value, tipo: 'material' });
      toast.success('Material criado com sucesso!');
    }
    closeModal();
    loadEstoque();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao salvar material');
    console.error('Erro ao salvar material:', error);
  }
};

const editMaterial = (material) => {
  openModal(material);
};

const confirmDeleteAction = async (material) => {
  try {
    const confirmed = await confirmDelete(material.nome, 'material');
    if (confirmed) {
      await deleteMaterial(material);
    }
  } catch {
    // Usuário cancelou
  }
};

const confirmDeleteFromDetails = async () => {
  if (selectedMaterial.value) {
    try {
      const confirmed = await confirmDelete(selectedMaterial.value.nome, 'material');
      if (confirmed) {
        await deleteMaterial(selectedMaterial.value);
        closeDetailsModal();
      }
    } catch {
      // Usuário cancelou
    }
  }
};

const deleteMaterial = async (material) => {
  try {
    await materialService.delete(material.id);
    toast.success('Material excluído com sucesso!');
    loadEstoque();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao excluir material');
    console.error('Erro ao excluir material:', error);
  }
};

const loadMovimentacoes = async () => {
  if (!selectedMaterial.value || !selectedMaterial.value.id) return;
  
  loadingMovimentacoes.value = true;
  try {
    const data = await movimentacaoService.getAll({
      material_id: selectedMaterial.value.id
    });
    movimentacoes.value = data;
  } catch (error) {
    toast.error('Erro ao carregar movimentações');
    console.error('Erro ao carregar movimentações:', error);
  } finally {
    loadingMovimentacoes.value = false;
  }
};

const alimentarEstoque = async () => {
  if (!selectedMaterial.value || !selectedMaterial.value.id) return;
  
  // Validação
  entradaErrors.value = {};
  if (!entradaForm.value.quantidade || entradaForm.value.quantidade <= 0) {
    entradaErrors.value.quantidade = 'Quantidade deve ser maior que zero';
    return;
  }

  loadingEntrada.value = true;
  try {
    await movimentacaoService.create({
      material_id: selectedMaterial.value.id,
      tipo: 'entrada',
      quantidade: entradaForm.value.quantidade,
      valor_unitario: entradaForm.value.valor_unitario || 0,
      observacoes: entradaForm.value.observacoes || null
    });
    
    toast.success('Estoque alimentado com sucesso!');
    
    // Limpar formulário
    entradaForm.value = {
      quantidade: 0,
      valor_unitario: 0,
      observacoes: ''
    };
    entradaErrors.value = {};
    
    // Recarregar dados
    await loadMovimentacoes();
    await loadEstoque();
    
    // Atualizar material selecionado
    const updated = await estoqueService.getById(selectedMaterial.value.id);
    selectedMaterial.value = updated;
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao alimentar estoque');
    console.error('Erro ao alimentar estoque:', error);
  } finally {
    loadingEntrada.value = false;
  }
};

const getTipoLabel = (tipo) => {
  const labels = {
    entrada: 'Entrada',
    saida: 'Saída',
    transferencia: 'Transferência',
    ajuste: 'Ajuste',
    devolucao: 'Devolução',
    perda: 'Perda',
    quebra: 'Quebra'
  };
  return labels[tipo] || tipo;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  loadEstoque();
  loadCategorias();
  loadFornecedores();
});
</script>

<style scoped>
.estoque-page {
  width: 100%;
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.header-actions .btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filters-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 1rem;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  font-size: 0.875rem;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.estoque-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.estoque-table thead {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.estoque-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.estoque-table th.actions-column {
  text-align: center;
  width: 140px;
  min-width: 140px;
}

.estoque-table tbody tr {
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.15s;
}

.estoque-table tbody tr:hover {
  background: #f9fafb;
}

.estoque-table tbody tr.row-estoque-baixo {
  background: #fffbeb;
}

.estoque-table tbody tr.row-estoque-baixo:hover {
  background: #fef3c7;
}

.estoque-table tbody tr.row-estoque-zero {
  background: #fef2f2;
}

.estoque-table tbody tr.row-estoque-zero:hover {
  background: #fee2e2;
}

.estoque-table td {
  padding: 1rem;
  color: #111827;
  vertical-align: middle;
}

.nome-cell {
  min-width: 200px;
}

.nome-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nome-content strong {
  font-weight: 600;
  color: #111827;
}

.descricao-preview {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
}

.number-cell {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.actions-cell {
  text-align: center;
  white-space: nowrap;
  width: 140px;
  min-width: 140px;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  white-space: nowrap;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
}

.btn-icon .icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* Botões apenas com ícone na tabela */
.table-actions .btn-icon {
  padding: 0.5rem;
  min-width: 2.5rem;
  min-height: 2.5rem;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  visibility: visible !important;
  opacity: 1 !important;
}

.table-actions .btn-icon:hover {
  background: var(--bg-color);
  border-color: var(--primary-color);
}

.table-actions .btn-icon:active {
  transform: scale(0.95);
}

/* Garantir que botões na tabela sem span fiquem apenas com ícone */
.table-actions .btn-sm.btn-icon {
  padding: 0.5rem;
}

.table-actions .btn-icon .icon {
  width: 1.125rem;
  height: 1.125rem;
  color: var(--text-color);
  display: block;
  flex-shrink: 0;
}

.table-actions .btn-icon:hover .icon {
  color: var(--primary-color);
}

.table-actions .btn-danger {
  border-color: #ef4444;
  color: #ef4444;
}

.table-actions .btn-danger:hover {
  background: #fee2e2;
  border-color: #dc2626;
}

.table-actions .btn-danger .icon {
  color: #ef4444;
}

.table-actions .btn-danger:hover .icon {
  color: #dc2626;
}

/* Esconder texto se houver span dentro do botão na tabela */
.table-actions .btn-icon span {
  display: none;
}

.categoria-badge {
  display: inline-block;
  background: #e5e7eb;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-zero {
  background: #fee2e2;
  color: #dc2626;
}

.status-baixo {
  background: #fef3c7;
  color: #d97706;
}

.status-normal {
  background: #d1fae5;
  color: #059669;
}

.text-muted {
  color: #9ca3af;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.details-content {
  padding: 0.5rem 0;
}

.details-header-actions {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.details-header-actions .btn {
  width: 100%;
  justify-content: center;
}

.details-section-actions {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e5e7eb;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 1rem 0;
}

.alimentar-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.details-section-history {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e5e7eb;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.movimentacoes-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.movimentacao-item {
  background: #f9fafb;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 0px solid #e5e7eb;
  transition: all 0.2s;
}

.movimentacao-item:hover {
  background: #f3f4f6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.movimentacao-entrada {
  border: 1px solid #10b981;
}

.movimentacao-saida {
  border: 1px solid #ef4444;
}

.movimentacao-transferencia {
  border: 1px solid #3b82f6;
}

.movimentacao-ajuste {
  border: #f59e0b;
}

.movimentacao-devolucao {
  border: #8b5cf6;
}

.movimentacao-perda,
.movimentacao-quebra {
  border: #dc2626;
}

.movimentacao-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.movimentacao-tipo {
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-color);
}

.movimentacao-data {
  font-size: 0.75rem;
  color: #6b7280;
}

.movimentacao-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.movimentacao-info {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.movimentacao-info .label {
  color: #6b7280;
  font-weight: 500;
  min-width: 100px;
}

.movimentacao-info .value {
  color: var(--text-color);
  flex: 1;
}

.empty-history {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-style: italic;
}

.details-image {
  width: 100%;
  max-width: 300px;
  margin: 0 auto 1.5rem;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #f3f4f6;
}

.details-image img {
  width: 100%;
  height: auto;
  display: block;
}

.details-section {
  margin-bottom: 1.5rem;
  text-align: center;
}

.details-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: var(--text-color);
}

.details-badge {
  display: inline-block;
  background: #e5e7eb;
  color: #374151;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.details-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.detail-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.detail-value {
  font-size: 1rem;
  color: var(--text-color);
  font-weight: 500;
}

.detail-description {
  margin: 0;
  color: var(--text-color);
  line-height: 1.6;
  white-space: pre-wrap;
}

@media (max-width: 1024px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .table-container {
    overflow-x: auto;
  }

  .estoque-table {
    min-width: 1000px;
  }

  .estoque-table th,
  .estoque-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.8125rem;
  }

  .table-actions {
    flex-direction: column;
  }

  .btn-sm {
    width: 100%;
  }

  .btn-icon span {
    display: inline;
  }
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .estoque-table th,
  .estoque-table td {
    padding: 0.5rem 0.375rem;
    font-size: 0.75rem;
  }

  .nome-cell {
    min-width: 150px;
  }
}
</style>
