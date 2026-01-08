<template>
  <Navbar />

  <main class="relative flex min-h-screen flex-col items-center">
    <div class="grid-backdrop" />
    <slot />
  </main>

  <Footer />
</template>

<style scoped>
.grid-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.3;
  background-image:
    linear-gradient(to right, var(--muted) 1px, transparent 1px),
    linear-gradient(to bottom, var(--muted) 1px, transparent 1px);
  background-size: 250px 250px;
}

main > *:not(.grid-backdrop) {
  position: relative;
  z-index: 1;
}
</style>
