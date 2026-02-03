<template>
  <div class="image-upload">
    <label v-if="label" class="input-label">{{ label }}</label>
    <div class="image-upload-container">
      <div v-if="previewUrl || modelValue" class="image-preview-wrapper">
        <div class="image-preview">
          <img :src="previewUrl || modelValue" alt="Preview" />
          <button type="button" class="image-remove" @click="removeImage" aria-label="Remover imagem">
            <XMarkIcon class="icon" />
          </button>
          <button type="button" class="image-change" @click="triggerFileInput" aria-label="Trocar imagem">
            <PencilIcon class="icon" />
          </button>
        </div>
      </div>
      <div v-else class="image-upload-placeholder" @click="triggerFileInput">
        <div class="placeholder-content">
          <PhotoIcon class="placeholder-icon" />
          <div class="placeholder-text">
            <span class="placeholder-main">Clique para adicionar imagem</span>
            <span class="placeholder-hint">PNG, JPG até 2MB (será comprimida automaticamente)</span>
          </div>
        </div>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        @change="handleFileChange"
        class="image-upload-input"
        :disabled="disabled"
      />
    </div>
    <p v-if="error" class="input-error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { XMarkIcon, PencilIcon, PhotoIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  maxSize: {
    type: Number,
    default: 2 * 1024 * 1024 // 2MB
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const fileInput = ref(null);
const previewUrl = ref('');
const selectedFile = ref(null);

const triggerFileInput = () => {
  if (!props.disabled) {
    fileInput.value?.click();
  }
};

// Função para comprimir imagem
const compressImage = (file, maxWidth = 600, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionar se necessário
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para base64 com qualidade reduzida
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const handleFileChange = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validar tamanho
  if (file.size > props.maxSize) {
    emit('update:modelValue', '');
    previewUrl.value = '';
    selectedFile.value = null;
    return;
  }

  // Validar tipo
  if (!file.type.startsWith('image/')) {
    emit('update:modelValue', '');
    previewUrl.value = '';
    selectedFile.value = null;
    return;
  }

  selectedFile.value = file;

  try {
    // Comprimir imagem antes de converter para base64
    // Iniciar com qualidade e tamanho menores para evitar erro 413
    let compressedBase64 = await compressImage(file, 500, 0.6);
    
    // Validar tamanho da string base64 (limitar a ~400KB em base64 para evitar erro 413)
    // Base64 é aproximadamente 33% maior que o arquivo original
    if (compressedBase64.length > 400000) {
      // Tentar com qualidade ainda menor e tamanho menor
      compressedBase64 = await compressImage(file, 400, 0.5);
    }
    
    // Se ainda estiver muito grande, forçar qualidade mínima
    if (compressedBase64.length > 400000) {
      compressedBase64 = await compressImage(file, 300, 0.4);
    }
    
    previewUrl.value = compressedBase64;
    emit('update:modelValue', compressedBase64);
    emit('change', file);
  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    // Fallback: usar o método original sem compressão
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl.value = e.target.result;
      emit('update:modelValue', e.target.result);
      emit('change', file);
    };
    reader.readAsDataURL(file);
  }
};

const removeImage = () => {
  previewUrl.value = '';
  selectedFile.value = null;
  emit('update:modelValue', '');
  emit('change', null);
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    previewUrl.value = '';
    selectedFile.value = null;
  }
});
</script>

<style scoped>
.image-upload {
  margin-bottom: 1rem;
}

.image-upload-container {
  position: relative;
  width: 100%;
}

.image-preview-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.image-preview {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-remove,
.image-change {
  position: absolute;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 0.375rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.image-remove {
  top: 0.5rem;
  right: 0.5rem;
}

.image-remove:hover {
  background: rgba(220, 38, 38, 0.9);
  transform: scale(1.05);
}

.image-change {
  bottom: 0.5rem;
  right: 0.5rem;
}

.image-change:hover {
  background: rgba(59, 130, 246, 0.9);
  transform: scale(1.05);
}

.image-remove .icon,
.image-change .icon {
  width: 1.2rem;
  height: 1.2rem;
}

.image-upload-placeholder {
  width: 100%;
  height: 120px;
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
}

.image-upload-placeholder:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.placeholder-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.placeholder-icon {
  width: 2rem;
  height: 2rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.placeholder-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.placeholder-main {
  color: #6b7280;
  font-weight: 500;
  font-size: 0.875rem;
}

.placeholder-hint {
  font-size: 0.75rem;
  color: #9ca3af;
}

.image-upload-input {
  display: none;
}

.input-error {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #ef4444;
}
</style>
