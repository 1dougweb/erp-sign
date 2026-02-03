<template>
  <div class="input-group">
    <label v-if="label" :for="id" class="input-label">{{ label }}</label>
    <div class="input-wrapper" :class="{ 'input-password': type === 'password' }">
      <input
        :id="id"
        :type="showPassword ? 'text' : type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="['input', { 'input-error': error }]"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
      />
      <button
        v-if="type === 'password'"
        type="button"
        class="password-toggle"
        @click="showPassword = !showPassword"
        :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
      >
        <EyeIcon v-if="!showPassword" class="icon" />
        <EyeSlashIcon v-else class="icon" />
      </button>
    </div>
    <span v-if="error" class="input-error-message">{{ error }}</span>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline';

defineProps({
  id: String,
  label: String,
  type: {
    type: String,
    default: 'text'
  },
  modelValue: [String, Number],
  placeholder: String,
  disabled: Boolean,
  error: String
});

defineEmits(['update:modelValue', 'blur']);

const showPassword = ref(false);
</script>

<style scoped>
.input-group {
  margin-bottom: 1rem;
}

.input-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
}

.input-wrapper {
  position: relative;
}

.input-wrapper.input-password .input {
  padding-right: 2.75rem;
}

.input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: white;
}

.input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.input:disabled {
  background-color: var(--bg-color);
  cursor: not-allowed;
  opacity: 0.6;
}

.input-error {
  border-color: var(--danger-color);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.password-toggle {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  border-radius: 0.25rem;
  transition: color 0.2s, background-color 0.2s;
}

.password-toggle:hover {
  color: var(--text-color);
  background-color: var(--bg-color);
}

.password-toggle:focus {
  outline: none;
  color: var(--primary-color);
  background-color: rgba(79, 70, 229, 0.1);
}

.password-toggle .icon {
  width: 1.25rem;
  height: 1.25rem;
}

.input-error-message {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--danger-color);
}
</style>
