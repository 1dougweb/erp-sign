<template>
  <div class="google-maps-autocomplete">
    <div class="input-group">
      <label v-if="label" :for="id" class="input-label">{{ label }}</label>
      <div class="autocomplete-wrapper">
        <input
          :id="id"
          ref="addressInput"
          :value="addressValue"
          @input="onInput"
          type="text"
          :placeholder="placeholder"
          class="input"
          :class="{ 'input-error': error }"
          :required="required"
        />
        <button
          v-if="showCepButton"
          type="button"
          class="btn-cep"
          @click="searchByCEP"
          :disabled="loadingCep"
        >
          {{ loadingCep ? 'Buscando...' : 'Buscar CEP' }}
        </button>
      </div>
      <div v-if="showCepInput" class="cep-input-wrapper">
        <input
          v-model="cepInput"
          @blur="onCepBlur"
          @input="onCepInput"
          type="text"
          placeholder="Digite o CEP (00000-000)"
          class="input input-small"
          maxlength="9"
        />
      </div>
      <span v-if="error" class="error-message">{{ error }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { initGoogleMaps, searchCEP, geocodeAddress, formatCEP } from '../../services/googleMapsService.js';

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  modelValue: {
    type: String,
    default: ''
  },
  cep: {
    type: String,
    default: ''
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Digite o endereço...'
  },
  error: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  showCepButton: {
    type: Boolean,
    default: true
  },
  showCepInput: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue', 'update:cep', 'update:latitude', 'update:longitude', 'place-selected']);

const addressInput = ref(null);
const addressValue = ref(props.modelValue);
const cepInput = ref(props.cep ? formatCEP(props.cep) : '');
const loadingCep = ref(false);
let autocomplete = null;
let placeListener = null;

watch(() => props.modelValue, (newValue) => {
  addressValue.value = newValue;
});

watch(() => props.cep, (newValue) => {
  cepInput.value = newValue ? formatCEP(newValue) : '';
});

const onInput = (event) => {
  addressValue.value = event.target.value;
  emit('update:modelValue', addressValue.value);
};

const onCepInput = (event) => {
  let value = event.target.value.replace(/\D/g, '');
  if (value.length <= 8) {
    value = value.replace(/(\d{5})(\d{3})/, '$1-$2');
    cepInput.value = value;
    if (value.length === 9) {
      // Auto-buscar quando CEP completo
      searchByCEP();
    }
  }
};

const onCepBlur = () => {
  if (cepInput.value.length === 9) {
    searchByCEP();
  }
};

const searchByCEP = async () => {
  if (!cepInput.value || cepInput.value.replace(/\D/g, '').length !== 8) {
    return;
  }

  loadingCep.value = true;
  try {
    const result = await searchCEP(cepInput.value);
    if (result) {
      addressValue.value = result.endereco;
      emit('update:modelValue', result.endereco);
      emit('update:cep', result.cep);
      
      // Geocodificar para obter coordenadas
      const geocodeResult = await geocodeAddress(result.endereco);
      if (geocodeResult) {
        emit('update:latitude', geocodeResult.latitude);
        emit('update:longitude', geocodeResult.longitude);
      }
      
      // Atualizar autocomplete
      if (addressInput.value) {
        addressInput.value.value = result.endereco;
      }
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
  } finally {
    loadingCep.value = false;
  }
};

const initAutocomplete = async () => {
  try {
    const initialized = await initGoogleMaps();
    if (!initialized || !addressInput.value) {
      return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('Google Maps Places API não carregada');
      return;
    }

    autocomplete = new window.google.maps.places.Autocomplete(addressInput.value, {
      componentRestrictions: { country: 'br' },
      fields: ['address_components', 'geometry', 'formatted_address'],
      types: ['address']
    });

    placeListener = autocomplete.addListener('place_changed', async () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        return;
      }

      const formattedAddress = place.formatted_address;
      addressValue.value = formattedAddress;
      emit('update:modelValue', formattedAddress);

      // Extrair CEP dos componentes
      let cep = '';
      for (const component of place.address_components) {
        if (component.types.includes('postal_code')) {
          cep = component.long_name.replace(/\D/g, '');
          break;
        }
      }
      
      if (cep) {
        cepInput.value = formatCEP(cep);
        emit('update:cep', cep);
      }

      // Obter coordenadas
      const location = place.geometry.location;
      const lat = location.lat();
      const lng = location.lng();
      
      emit('update:latitude', lat);
      emit('update:longitude', lng);
      
      emit('place-selected', {
        address: formattedAddress,
        cep: cep,
        latitude: lat,
        longitude: lng,
        place: place
      });
    });
  } catch (error) {
    console.error('Erro ao inicializar autocomplete:', error);
  }
};

onMounted(() => {
  initAutocomplete();
});

onUnmounted(() => {
  if (placeListener) {
    window.google.maps.event.removeListener(placeListener);
  }
});
</script>

<style scoped>
.google-maps-autocomplete {
  width: 100%;
}

.autocomplete-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.autocomplete-wrapper .input {
  flex: 1;
}

.btn-cep {
  padding: 0.5rem 1rem;
  background: var(--primary-color, #ED4F11);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  white-space: nowrap;
  transition: background-color 0.2s;
}

.btn-cep:hover:not(:disabled) {
  background: var(--primary-color-dark, #bd3f0e);
}

.btn-cep:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cep-input-wrapper {
  margin-top: 0.5rem;
}

.input-small {
  max-width: 200px;
}

.error-message {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #ef4444;
}

.input-error {
  border-color: #ef4444;
}
</style>
