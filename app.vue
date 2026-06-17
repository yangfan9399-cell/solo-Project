<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  router.push('/')
})
</script>

<template>
  <NuxtPage />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #__nuxt {
  height: 100%;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
</style>
