<template>
  <div class="dashboard">
    <h1 class="page-title">Dashboard</h1>
    <div class="dashboard-grid">
      <div class="dashboard-card">
        <h3>Projetos</h3>
        <p class="dashboard-number">{{ stats.projetos }}</p>
      </div>
      <div class="dashboard-card">
        <h3>Tarefas</h3>
        <p class="dashboard-number">{{ stats.tarefas }}</p>
      </div>
      <div class="dashboard-card">
        <h3>Cronogramas</h3>
        <p class="dashboard-number">{{ stats.cronogramas }}</p>
      </div>
      <div class="dashboard-card">
        <h3>Funcionários</h3>
        <p class="dashboard-number">{{ stats.funcionarios }}</p>
      </div>
      <div class="dashboard-card" v-if="stats.alertas_estoque > 0" style="border-left: 4px solid #f59e0b;">
        <h3>Alertas de Estoque</h3>
        <p class="dashboard-number" style="color: #f59e0b;">{{ stats.alertas_estoque }}</p>
        <router-link to="/estoque" class="dashboard-link">Ver estoque</router-link>
      </div>
      <div class="dashboard-card" v-if="stats.requisicoes_pendentes > 0" style="border-left: 4px solid #3b82f6;">
        <h3>Requisições Pendentes</h3>
        <p class="dashboard-number" style="color: #3b82f6;">{{ stats.requisicoes_pendentes }}</p>
        <router-link to="/requisicoes" class="dashboard-link">Ver requisições</router-link>
      </div>
    </div>

    <!-- Alertas de Estoque -->
    <div v-if="alertas.length > 0" class="alertas-section">
      <h2 class="section-title">Alertas de Estoque</h2>
      <div class="alertas-list">
        <div
          v-for="alerta in alertas.slice(0, 5)"
          :key="alerta.id"
          class="alerta-card"
          :class="`alerta-${alerta.tipo_alerta}`"
        >
          <div class="alerta-content">
            <strong>{{ alerta.material_nome }}</strong>
            <p>{{ getAlertaMessage(alerta) }}</p>
          </div>
          <router-link to="/estoque" class="btn btn-sm btn-outline">Ver</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { projetoService } from '../services/projetoService.js';
import { funcionarioService } from '../services/funcionarioService.js';
import { cronogramaService } from '../services/cronogramaService.js';
import { alertaService } from '../services/estoqueService.js';
import { requisicaoService } from '../services/requisicaoService.js';

const stats = ref({
  projetos: 0,
  tarefas: 0,
  cronogramas: 0,
  funcionarios: 0,
  alertas_estoque: 0,
  requisicoes_pendentes: 0
});

const alertas = ref([]);

const loadStats = async () => {
  try {
    const [projetos, funcionarios, cronogramas] = await Promise.all([
      projetoService.getAll(),
      funcionarioService.getAll(),
      cronogramaService.getAll()
    ]);

    stats.value.projetos = projetos.length;
    stats.value.funcionarios = funcionarios.length;
    stats.value.cronogramas = cronogramas.length;

    // Contar tarefas de todos os projetos
    let totalTarefas = 0;
    for (const projeto of projetos) {
      const tarefas = await import('../services/tarefaService.js').then(m => m.tarefaService.getByProjeto(projeto.id));
      totalTarefas += tarefas.length;
    }
    stats.value.tarefas = totalTarefas;

    // Carregar alertas de estoque
    try {
      const alertasData = await alertaService.getAll({ visualizado: false, resolvido: false });
      alertas.value = alertasData;
      stats.value.alertas_estoque = alertasData.length;
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    }

    // Carregar requisições pendentes
    try {
      const requisicoes = await requisicaoService.getAll({ status: 'pendente' });
      stats.value.requisicoes_pendentes = requisicoes.length;
    } catch (error) {
      console.error('Erro ao carregar requisições:', error);
    }
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
};

const getAlertaMessage = (alerta) => {
  if (alerta.tipo_alerta === 'estoque_zero') {
    return 'Estoque zerado!';
  } else if (alerta.tipo_alerta === 'estoque_minimo') {
    return `Estoque abaixo do mínimo (${alerta.quantidade_estoque} / ${alerta.estoque_minimo})`;
  }
  return 'Alerta de estoque';
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
}


.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.dashboard-card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  padding: 1.5rem;
}

.dashboard-card h3 {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-light);
  margin-bottom: 0.5rem;
}

.dashboard-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
}

.dashboard-link {
  display: inline-block;
  margin-top: 0.5rem;
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
}

.dashboard-link:hover {
  text-decoration: underline;
}

.alertas-section {
  margin-top: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.alertas-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alerta-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid;
}

.alerta-estoque_zero {
  border-left-color: #ef4444;
}

.alerta-estoque_minimo {
  border-left-color: #f59e0b;
}

.alerta-content {
  flex: 1;
}

.alerta-content strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #111827;
}

.alerta-content p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}
</style>
