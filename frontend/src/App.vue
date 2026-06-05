<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="container" style="padding: 0 24px;">
        <h1>🏢 商场商户装修消防验收平台</h1>
      </div>
    </header>
    <main class="container">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
}
</style>
