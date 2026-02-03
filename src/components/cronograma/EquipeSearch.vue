<template>
  <div class="equipe-search">
    <div class="input-group">
      <label v-if="label" :for="searchId" class="input-label">{{ label }}</label>
      <div class="search-wrapper">
        <input
          :id="searchId"
          ref="searchInput"
          v-model="searchTerm"
          @input="onSearch"
          type="text"
          :placeholder="placeholder"
          class="input"
          :class="{ 'input-error': error }"
        />
      </div>
      <span v-if="error" class="error-message">{{ error }}</span>
    </div>

    <!-- Lista de resultados de busca -->
    <div v-if="showResults && filteredEquipes.length > 0" class="search-results">
      <div
        v-for="equipe in filteredEquipes"
        :key="equipe.id"
        class="result-item"
        @click="addEquipe(equipe)"
      >
        <div class="result-content">
          <strong>{{ equipe.nome }}</strong>
          <span v-if="equipe.tipo_instalacao_nome" class="result-subtitle">
            - {{ equipe.tipo_instalacao_nome }}
          </span>
        </div>
        <span v-if="equipe.funcionarios && equipe.funcionarios.length > 0" class="result-count">
          {{ equipe.funcionarios.length }} funcionário{{ equipe.funcionarios.length > 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <div v-if="showResults && searchTerm && filteredEquipes.length === 0" class="no-results">
      <p>Nenhuma equipe encontrada</p>
    </div>

    <!-- Equipes adicionadas -->
    <div v-if="selectedEquipes.length > 0" class="selected-equipes">
      <label class="input-label">Equipes Adicionadas</label>
      <div class="equipes-list">
        <div
          v-for="equipe in selectedEquipes"
          :key="equipe.id"
          class="equipe-card"
        >
          <div class="equipe-header">
            <div class="equipe-info">
              <strong class="equipe-nome">{{ equipe.nome }}</strong>
              <span v-if="equipe.tipo_instalacao_nome" class="equipe-tipo">
                - {{ equipe.tipo_instalacao_nome }}
              </span>
            </div>
            <button
              type="button"
              class="equipe-remove"
              @click="removeEquipe(equipe.id)"
              title="Remover"
            >
              ×
            </button>
          </div>
          <div v-if="equipe.funcionarios && equipe.funcionarios.length > 0" class="equipe-funcionarios">
            <span class="funcionarios-label">Funcionários:</span>
            <div class="funcionarios-list">
              <span
                v-for="funcionario in equipe.funcionarios"
                :key="funcionario.id"
                class="funcionario-tag"
              >
                {{ funcionario.nome }}
                <span v-if="funcionario.cargo" class="funcionario-cargo">
                  ({{ funcionario.cargo }})
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';

const props = defineProps({
  id: {
    type: String,
    default: 'equipe-search'
  },
  label: {
    type: String,
    default: 'Equipes'
  },
  placeholder: {
    type: String,
    default: 'Pesquise por nome da equipe...'
  },
  equipes: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: Array,
    default: () => []
  },
  error: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const searchInput = ref(null);
const searchTerm = ref('');
const showResults = ref(false);
const selectedEquipes = ref([...props.modelValue]);

const searchId = computed(() => props.id);

const filteredEquipes = computed(() => {
  if (!searchTerm.value.trim()) {
    return [];
  }

  const term = searchTerm.value.toLowerCase();
  return props.equipes.filter(equipe => {
    // Verificar se já foi adicionada
    if (selectedEquipes.value.find(e => e.id === equipe.id)) {
      return false;
    }

    // Filtrar por nome ou tipo de instalação
    return (
      equipe.nome?.toLowerCase().includes(term) ||
      equipe.tipo_instalacao_nome?.toLowerCase().includes(term)
    );
  }).slice(0, 5); // Limitar a 5 resultados
});

const onSearch = () => {
  showResults.value = searchTerm.value.trim().length > 0;
};

const addEquipe = (equipe) => {
  if (!selectedEquipes.value.find(e => e.id === equipe.id)) {
    selectedEquipes.value.push(equipe);
    emit('update:modelValue', selectedEquipes.value);
    searchTerm.value = '';
    showResults.value = false;
  }
};

const removeEquipe = (equipeId) => {
  selectedEquipes.value = selectedEquipes.value.filter(e => e.id !== equipeId);
  emit('update:modelValue', selectedEquipes.value);
};

watch(() => props.modelValue, (newValue) => {
  selectedEquipes.value = [...newValue];
}, { deep: true });

// Fechar resultados ao clicar fora
const handleClickOutside = (event) => {
  if (searchInput.value && !searchInput.value.contains(event.target)) {
    showResults.value = false;
  }
};

watch(() => showResults.value, (show) => {
  if (show) {
    document.addEventListener('click', handleClickOutside);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.equipe-search {
  width: 100%;
  position: relative;
}

.search-wrapper {
  position: relative;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s;
  border-bottom: 1px solid var(--border-color, #f3f4f6);
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background-color: var(--bg-color, #f9fafb);
}

.result-content {
  flex: 1;
  font-size: 0.875rem;
}

.result-subtitle {
  color: var(--text-light, #6b7280);
  font-weight: normal;
}

.result-count {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background-color: var(--bg-color, #f3f4f6);
  color: var(--text-color, #111827);
  font-weight: 500;
}

.no-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.375rem;
  padding: 1rem;
  text-align: center;
  color: var(--text-light, #6b7280);
  font-size: 0.875rem;
  z-index: 1000;
}

.selected-equipes {
  margin-top: 1rem;
}

.equipes-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.equipe-card {
  padding: 0.75rem;
  background-color: var(--bg-color, #f9fafb);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.375rem;
  transition: box-shadow 0.15s;
}

.equipe-card:hover {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.equipe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.equipe-info {
  flex: 1;
}

.equipe-nome {
  color: var(--primary-color, #3b82f6);
  font-size: 0.9375rem;
}

.equipe-tipo {
  color: var(--text-light, #6b7280);
  font-size: 0.875rem;
  font-weight: normal;
}

.equipe-remove {
  background: none;
  border: none;
  color: var(--text-light, #6b7280);
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.15s, color 0.15s;
}

.equipe-remove:hover {
  background-color: #fee2e2;
  color: #991b1b;
}

.equipe-funcionarios {
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.funcionarios-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-light, #6b7280);
  margin-bottom: 0.5rem;
}

.funcionarios-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.funcionario-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.625rem;
  background-color: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  color: var(--text-color, #111827);
}

.funcionario-cargo {
  color: var(--text-light, #6b7280);
  margin-left: 0.25rem;
}

.error-message {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #ef4444;
}
</style>