<template>
  <ConfirmModal
    v-model:show="showModal"
    :title="modalConfig.title"
    :message="modalConfig.message"
    :details="modalConfig.details"
    :type="modalConfig.type"
    :confirm-text="modalConfig.confirmText"
    :cancel-text="modalConfig.cancelText"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>

<script setup>
import ConfirmModal from '../common/ConfirmModal.vue';
import { showModal, modalConfig, handleConfirm, handleCancel } from '../../composables/useConfirm.js';
</script>
