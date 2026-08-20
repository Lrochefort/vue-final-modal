<script setup lang="ts">
import { ModalsContainer } from '@lrochefort/vue-final-modal'
import { showConfirmModal } from './showConfirmModal'
</script>

<template>
  <button @click="() => showConfirmModal()">
    Open Modal
  </button>

  <ModalsContainer />
</template>
