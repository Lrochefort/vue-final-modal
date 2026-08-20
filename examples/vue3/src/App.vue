<script setup lang="ts">
import { ModalsContainer } from '@lrochefort/vue-final-modal'
import MyModalPreview from './components/MyModalPreview.vue'
</script>

<template>
  <div class="h-screen flex items-center justify-center">
    <MyModalPreview />
  </div>
  <ModalsContainer />
</template>
