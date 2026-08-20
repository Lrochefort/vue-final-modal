<script setup lang="ts">
// Rendered above the Docus layout in `app.vue`, so it appears on every page.
// The docs content is inherited from upstream vue-final-modal and still refers
// to the original package names in places, hence the permanent warning.
</script>

<template>
  <div class="fork-banner">
    <strong>Unofficial fork.</strong>
    These docs describe
    <code>@lrochefort/vue-final-modal</code>, a fork of
    <a
      href="https://github.com/vue-final/vue-final-modal"
      target="_blank"
      rel="noopener noreferrer"
    >vue-final-modal</a>. Wherever a page says <code>vue-final-modal</code>, install
    <code>@lrochefort/vue-final-modal</code> instead.
    <a href="/get-started/guide/migration-guide">Migration guide</a>
  </div>
</template>

<style scoped>
.fork-banner {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0.75rem 1rem;
  background-color: #b45309;
  color: #fff;
  font-size: 0.9375rem;
  line-height: 1.5;
  text-align: center;
}

.fork-banner a {
  color: #fff;
  font-weight: 600;
  text-decoration: underline;
}

.fork-banner code {
  padding: 0.0625rem 0.25rem;
  border-radius: 0.25rem;
  background-color: rgb(0 0 0 / 25%);
  font-size: 0.875em;
}
</style>
