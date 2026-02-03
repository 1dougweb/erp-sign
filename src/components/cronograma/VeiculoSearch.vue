<template>
  <div class="veiculo-search">
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
    <div v-if="showResults && filteredVeiculos.length > 0" class="search-results">
      <div
        v-for="veiculo in filteredVeiculos"
        :key="veiculo.id"
        class="result-item"
        @click="addVeiculo(veiculo)"
      >
        <div v-if="veiculo.imagem_url" class="result-image">
          <img :src="veiculo.imagem_url" :alt="veiculo.modelo || veiculo.placa" />
        </div>
        <div class="result-content">
          <strong>{{ veiculo.placa }}</strong>
          <span v-if="veiculo.modelo"> - {{ veiculo.modelo }}</span>
          <span v-if="veiculo.marca"> ({{ veiculo.marca }})</span>
        </div>
        <span class="result-status" :class="veiculo.disponivel ? 'status-available' : 'status-unavailable'">
          {{ veiculo.disponivel ? 'Disponível' : 'Indisponível' }}
        </span>
      </div>
    </div>

    <div v-if="showResults && searchTerm && filteredVeiculos.length === 0" class="no-results">
      <p>Nenhum veículo encontrado</p>
    </div>

    <!-- Veículos adicionados -->
    <div v-if="selectedVeiculos.length > 0" class="selected-veiculos">
      <label class="input-label">Veículos Adicionados</label>
      <div class="veiculos-tags">
        <span
          v-for="veiculo in selectedVeiculos"
          :key="veiculo.id"
          class="veiculo-tag"
        >
          {{ veiculo.placa }}
          <span v-if="veiculo.modelo"> - {{ veiculo.modelo }}</span>
          <button
            type="button"
            class="tag-remove"
            @click="removeVeiculo(veiculo.id)"
            title="Remover"
          >
            ×
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';

const props = defineProps({
  id: {
    type: String,
    default: 'veiculo-search'
  },
  label: {
    type: String,
    default: 'Veículos'
  },
  placeholder: {
    type: String,
    default: 'Pesquise por placa, modelo ou marca...'
  },
  veiculos: {
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
const selectedVeiculos = ref([...props.modelValue]);

const searchId = computed(() => props.id);

const filteredVeiculos = computed(() => {
  if (!searchTerm.value.trim()) {
    return [];
  }

  const term = searchTerm.value.toLowerCase();
  return props.veiculos.filter(veiculo => {
    // Verificar se já foi adicionado
    if (selectedVeiculos.value.find(v => v.id === veiculo.id)) {
      return false;
    }

    // Filtrar por placa, modelo ou marca
    return (
      veiculo.placa?.toLowerCase().includes(term) ||
      veiculo.modelo?.toLowerCase().includes(term) ||
      veiculo.marca?.toLowerCase().includes(term)
    );
  }).slice(0, 5); // Limitar a 5 resultados
});

const onSearch = () => {
  showResults.value = searchTerm.value.trim().length > 0;
};

const addVeiculo = (veiculo) => {
  if (!selectedVeiculos.value.find(v => v.id === veiculo.id)) {
    selectedVeiculos.value.push(veiculo);
    emit('update:modelValue', selectedVeiculos.value);
    searchTerm.value = '';
    showResults.value = false;
  }
};

const removeVeiculo = (veiculoId) => {
  selectedVeiculos.value = selectedVeiculos.value.filter(v => v.id !== veiculoId);
  emit('update:modelValue', selectedVeiculos.value);
};

watch(() => props.modelValue, (newValue) => {
  selectedVeiculos.value = [...newValue];
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
.veiculo-search {
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

.result-image {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border-radius: 0.375rem;
  overflow: hidden;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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

.result-status {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.status-available {
  background-color: #d1fae5;
  color: #065f46;
}

.status-unavailable {
  background-color: #fee2e2;
  color: #991b1b;
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

.selected-veiculos {
  margin-top: 1rem;
}

.veiculos-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.veiculo-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--primary-color, #3b82f6);
  color: white;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  padding: 0;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.15s;
}

.tag-remove:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.error-message {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #ef4444;
}
</style>
