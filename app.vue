<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main class="max-w-7xl mx-auto px-4 py-6">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const store = useRecordsStore()
const { restoreUser } = useCurrentUser()

if (process.server) {
  await Promise.all([
    store.fetchUsers(),
    store.fetchStations()
  ])
} else {
  onMounted(async () => {
    if (!store.users.length) {
      await Promise.all([
        store.fetchUsers(),
        store.fetchStations()
      ])
    }
    restoreUser()
  })
}
</script>
