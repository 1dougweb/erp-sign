<template>
  <div class="relatorios-page">
    <div class="page-header">
      <h1 class="page-title">Relatórios de Estoque</h1>
    </div>

    <div class="relatorios-grid">
      <div class="relatorio-card">
        <h3>Movimentações por Período</h3>
        <div class="filters-section">
          <input type="date" v-model="filtersMov.data_inicio" class="input" />
          <input type="date" v-model="filtersMov.data_fim" class="input" />
          <select v-model="filtersMov.tipo" class="input">
            <option value="">Todos os tipos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
          <Button @click="loadMovimentacoes">Gerar</Button>
        </div>
        <div v-if="movimentacoes.length > 0" class="table-container">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Valor Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mov in movimentacoes" :key="mov.data + mov.tipo">
                <td>{{ formatDate(mov.data) }}</td>
                <td>{{ mov.tipo }}</td>
                <td>{{ formatNumber(mov.quantidade_total) }}</td>
                <td>R$ {{ formatNumber(mov.valor_total, 2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="relatorio-card">
        <h3>Consumo por Material</h3>
        <div class="filters-section">
          <input type="date" v-model="filtersConsumo.data_inicio" class="input" />
          <input type="date" v-model="filtersConsumo.data_fim" class="input" />
          <Button @click="loadConsumo">Gerar</Button>
        </div>
        <div v-if="consumo.length > 0" class="table-container">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Quantidade Consumida</th>
                <th>Valor Consumido</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in consumo" :key="item.id">
                <td>{{ item.material_nome }}</td>
                <td>{{ formatNumber(item.quantidade_consumida) }}</td>
                <td>R$ {{ formatNumber(item.valor_consumido, 2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="relatorio-card">
        <h3>Estoque Atual vs Mínimo</h3>
        <Button @click="loadEstoqueVsMinimo">Gerar</Button>
        <div v-if="estoqueVsMinimo.length > 0" class="table-container">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Estoque Atual</th>
                <th>Estoque Mínimo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in estoqueVsMinimo" :key="item.id" :class="`status-${item.status}`">
                <td>{{ item.nome }}</td>
                <td>{{ formatNumber(item.quantidade_estoque) }}</td>
                <td>{{ formatNumber(item.estoque_minimo) }}</td>
                <td>
                  <span class="status-badge" :class="`badge-${item.status}`">
                    {{ getStatusLabel(item.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="relatorio-card">
        <h3>Histórico de Requisições</h3>
        <div class="filters-section">
          <input type="date" v-model="filtersReq.data_inicio" class="input" />
          <input type="date" v-model="filtersReq.data_fim" class="input" />
          <select v-model="filtersReq.status" class="input">
            <option value="">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="aprovada">Aprovada</option>
            <option value="atendida">Atendida</option>
          </select>
          <Button @click="loadRequisicoes">Gerar</Button>
        </div>
        <div v-if="requisicoes.length > 0" class="table-container">
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Status</th>
                <th>Data</th>
                <th>Solicitante</th>
                <th>Itens</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="req in requisicoes" :key="req.id">
                <td>{{ req.numero }}</td>
                <td>{{ getStatusLabel(req.status) }}</td>
                <td>{{ formatDate(req.data_solicitacao) }}</td>
                <td>{{ req.solicitante_nome }}</td>
                <td>{{ req.quantidade_itens }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { relatorioService } from '../services/estoqueService.js';
import { requisicaoService } from '../services/requisicaoService.js';
import Button from '../components/common/Button.vue';

const toast = useToast();

const movimentacoes = ref([]);
const consumo = ref([]);
const estoqueVsMinimo = ref([]);
const requisicoes = ref([]);

const filtersMov = ref({
  data_inicio: '',
  data_fim: '',
  tipo: ''
});

const filtersConsumo = ref({
  data_inicio: '',
  data_fim: ''
});

const filtersReq = ref({
  data_inicio: '',
  data_fim: '',
  status: ''
});

const loadMovimentacoes = async () => {
  try {
    const data = await relatorioService.movimentacoesPorPeriodo(filtersMov.value);
    movimentacoes.value = data;
  } catch (error) {
    toast.error('Erro ao carregar relatório');
    console.error(error);
  }
};

const loadConsumo = async () => {
  try {
    const data = await relatorioService.consumoPorMaterial(filtersConsumo.value);
    consumo.value = data;
  } catch (error) {
    toast.error('Erro ao carregar relatório');
    console.error(error);
  }
};

const loadEstoqueVsMinimo = async () => {
  try {
    const data = await relatorioService.estoqueAtualVsMinimo();
    estoqueVsMinimo.value = data;
  } catch (error) {
    toast.error('Erro ao carregar relatório');
    console.error(error);
  }
};

const loadRequisicoes = async () => {
  try {
    const data = await relatorioService.historicoRequisicoes(filtersReq.value);
    requisicoes.value = data;
  } catch (error) {
    toast.error('Erro ao carregar relatório');
    console.error(error);
  }
};

const formatNumber = (value, decimals = 2) => {
  if (!value && value !== 0) return '0';
  return parseFloat(value).toFixed(decimals);
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR');
};

const getStatusLabel = (status) => {
  const labels = {
    zero: 'Estoque Zero',
    baixo: 'Estoque Baixo',
    alto: 'Estoque Alto',
    normal: 'Normal',
    pendente: 'Pendente',
    aprovada: 'Aprovada',
    atendida: 'Atendida'
  };
  return labels[status] || status;
};
</script>

<style scoped>
.relatorios-page {
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.relatorios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2rem;
}

.relatorio-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.relatorio-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.filters-section {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f9fafb;
}

th {
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

td {
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
}

tbody tr:hover {
  background: #f9fafb;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-zero {
  background: #fee2e2;
  color: #dc2626;
}

.badge-baixo {
  background: #fef3c7;
  color: #d97706;
}

.badge-alto {
  background: #dbeafe;
  color: #2563eb;
}

.badge-normal {
  background: #d1fae5;
  color: #059669;
}

@media (max-width: 768px) {
  .relatorios-grid {
    grid-template-columns: 1fr;
  }
}
</style>
