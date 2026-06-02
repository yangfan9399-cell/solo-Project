<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const { initUser, fetchUsers } = useAuth()

onMounted(() => {
  initUser()
  fetchUsers()
})
</script>
