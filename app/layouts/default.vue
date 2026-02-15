<template>
  <Navbar />

  <main class="relative flex min-h-screen flex-col items-center">
    <div class="backdrop" />
    <slot />
  </main>

  <Footer />
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    to top,
    transparent 0,
    color-mix(in srgb, var(--muted-foreground) 5%, transparent) 4px,
    color-mix(in srgb, var(--muted-foreground) 5%, transparent) 8px
  );
}
</style>
