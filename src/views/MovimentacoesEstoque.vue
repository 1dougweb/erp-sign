<template>
  <div class="movimentacoes-page">
    <div class="page-header">
      <h1 class="page-title">Movimentações de Estoque</h1>
      <Button @click="openModal" v-if="authStore.isAdmin">+ Nova Movimentação</Button>
    </div>

    <!-- Filtros -->
    <div class="filters-section">
      <div class="filters-grid">
        <select v-model="filters.tipo" @change="loadMovimentacoes" class="input">
          <option value="">Todos os tipos</option>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
          <option value="transferencia">Transferência</option>
          <option value="ajuste">Ajuste</option>
          <option value="devolucao">Devolução</option>
          <option value="perda">Perda</option>
          <option value="quebra">Quebra</option>
        </select>
        <input
          type="date"
          v-model="filters.data_inicio"
          @change="loadMovimentacoes"
          class="input"
          placeholder="Data início"
        />
        <input
          type="date"
          v-model="filters.data_fim"
          @change="loadMovimentacoes"
          class="input"
          placeholder="Data fim"
        />
      </div>
    </div>

    <Loading v-if="loading" />
    <div v-else-if="movimentacoes.length === 0" class="empty-state">
      <p>Nenhuma movimentação encontrada.</p>
    </div>
    <div v-else class="movimentacoes-table">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Material</th>
            <th>Tipo</th>
            <th>Quantidade</th>
            <th>Valor Total</th>
            <th>Usuário</th>
            <th>Observações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mov in movimentacoes" :key="mov.id">
            <td>{{ formatDate(mov.data_movimentacao) }}</td>
            <td>{{ mov.material_nome }}</td>
            <td>
              <span class="tipo-badge" :class="`tipo-${mov.tipo}`">
                {{ getTipoLabel(mov.tipo) }}
              </span>
            </td>
            <td>{{ formatNumber(mov.quantidade) }} {{ mov.unidade_simbolo || '' }}</td>
            <td>R$ {{ formatNumber(mov.valor_total, 2) }}</td>
            <td>{{ mov.usuario_nome }}</td>
            <td>{{ mov.observacoes || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Offcanvas Nova Movimentação -->
    <Offcanvas
      v-model:show="showModal"
      :title="'Nova Movimentação'"
      position="right"
      @confirm="saveMovimentacao"
      @close="closeModal"
      v-if="authStore.isAdmin"
    >
      <form @submit.prevent="saveMovimentacao" class="form">
        <div class="input-group">
          <label for="material_id" class="input-label">Material *</label>
          <select id="material_id" v-model="form.material_id" class="input" required>
            <option value="">Selecione um material</option>
            <option v-for="mat in materiais" :key="mat.id" :value="mat.id">
              {{ mat.nome }}
            </option>
          </select>
        </div>
        <div class="input-group">
          <label for="tipo" class="input-label">Tipo *</label>
          <select id="tipo" v-model="form.tipo" class="input" required>
            <option value="">Selecione o tipo</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="transferencia">Transferência</option>
            <option value="ajuste">Ajuste</option>
            <option value="devolucao">Devolução</option>
            <option value="perda">Perda</option>
            <option value="quebra">Quebra</option>
          </select>
        </div>
        <div class="input-group">
          <label for="quantidade" class="input-label">Quantidade *</label>
          <input
            type="number"
            id="quantidade"
            v-model.number="form.quantidade"
            class="input"
            min="0.01"
            step="0.01"
            required
          />
        </div>
        <div class="input-group">
          <label for="unidade_id" class="input-label">Unidade</label>
          <select id="unidade_id" v-model="form.unidade_id" class="input">
            <option value="">Selecione unidade</option>
            <option v-for="un in unidades" :key="un.id" :value="un.id">
              {{ un.simbolo }} - {{ un.nome }}
            </option>
          </select>
        </div>
        <div class="input-group">
          <label for="valor_unitario" class="input-label">Valor Unitário</label>
          <input
            type="number"
            id="valor_unitario"
            v-model.number="form.valor_unitario"
            class="input"
            min="0"
            step="0.01"
          />
        </div>
        <div class="input-group">
          <label for="fornecedor_id" class="input-label">Fornecedor</label>
          <select id="fornecedor_id" v-model="form.fornecedor_id" class="input">
            <option value="">Selecione fornecedor</option>
            <option v-for="forn in fornecedores" :key="forn.id" :value="forn.id">
              {{ forn.nome }}
            </option>
          </select>
        </div>
        <div class="input-group">
          <label for="observacoes" class="input-label">Observações</label>
          <textarea
            id="observacoes"
            v-model="form.observacoes"
            class="input"
            rows="3"
            placeholder="Observações sobre a movimentação..."
          ></textarea>
        </div>
        <div class="input-group">
          <label for="documento_referencia" class="input-label">Documento de Referência</label>
          <input
            type="text"
            id="documento_referencia"
            v-model="form.documento_referencia"
            class="input"
            placeholder="Ex: NF 123, Pedido 456..."
          />
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="saveMovimentacao">Salvar</button>
      </template>
    </Offcanvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '../store/auth.js';
import { movimentacaoService, estoqueService, unidadeMedidaService } from '../services/estoqueService.js';
import { fornecedorService } from '../services/fornecedorService.js';
import Offcanvas from '../components/common/Offcanvas.vue';
import Loading from '../components/common/Loading.vue';
import Button from '../components/common/Button.vue';

const toast = useToast();
const authStore = useAuthStore();

const loading = ref(false);
const movimentacoes = ref([]);
const materiais = ref([]);
const unidades = ref([]);
const fornecedores = ref([]);
const filters = ref({
  tipo: '',
  data_inicio: '',
  data_fim: ''
});
const showModal = ref(false);
const form = ref({
  material_id: '',
  tipo: '',
  quantidade: 0,
  unidade_id: '',
  valor_unitario: 0,
  fornecedor_id: '',
  observacoes: '',
  documento_referencia: ''
});

const loadMovimentacoes = async () => {
  loading.value = true;
  try {
    const data = await movimentacaoService.getAll(filters.value);
    movimentacoes.value = data;
  } catch (error) {
    toast.error('Erro ao carregar movimentações');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const loadMateriais = async () => {
  try {
    const data = await estoqueService.getAll();
    materiais.value = data;
  } catch (error) {
    console.error('Erro ao carregar materiais:', error);
  }
};

const loadUnidades = async () => {
  try {
    const data = await unidadeMedidaService.getAll();
    unidades.value = data;
  } catch (error) {
    console.error('Erro ao carregar unidades:', error);
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

const openModal = () => {
  form.value = {
    material_id: '',
    tipo: '',
    quantidade: 0,
    unidade_id: '',
    valor_unitario: 0,
    fornecedor_id: '',
    observacoes: '',
    documento_referencia: ''
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveMovimentacao = async () => {
  try {
    await movimentacaoService.create(form.value);
    toast.success('Movimentação criada com sucesso!');
    closeModal();
    loadMovimentacoes();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao criar movimentação');
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

const formatNumber = (value, decimals = 2) => {
  if (!value && value !== 0) return '0';
  return parseFloat(value).toFixed(decimals);
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR');
};

onMounted(() => {
  loadMovimentacoes();
  loadMateriais();
  loadUnidades();
  loadFornecedores();
});
</script>

<style scoped>
.movimentacoes-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

.movimentacoes-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f9fafb;
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

tbody tr:hover {
  background: #f9fafb;
}

.tipo-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tipo-entrada {
  background: #d1fae5;
  color: #059669;
}

.tipo-saida {
  background: #fee2e2;
  color: #dc2626;
}

.tipo-transferencia {
  background: #dbeafe;
  color: #2563eb;
}

.tipo-ajuste {
  background: #fef3c7;
  color: #d97706;
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }

  .movimentacoes-table {
    overflow-x: auto;
  }
}
</style>
