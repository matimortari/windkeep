<template>
  <Navbar />

  <Loading v-if="isLoading" />

  <main v-show="!isLoading" class="relative flex min-h-screen flex-col items-center justify-center">
    <div class="grid-backdrop" />
    <slot />
  </main>

  <Footer />
</template>

<script setup lang="ts">
const isLoading = ref(true)

onMounted(async () => {
  await nextTick()
  isLoading.value = false
})
</script>

<style scoped>
.grid-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.25;
  background-image:
    linear-gradient(to right, var(--muted) 1px, transparent 1px),
    linear-gradient(to bottom, var(--muted) 1px, transparent 1px);
  background-size: 50px 50px;
}

main > *:not(.grid-backdrop) {
  position: relative;
  z-index: 1;
}
</style>
