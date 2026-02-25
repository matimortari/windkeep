<template>
  <Navbar />

  <main class="relative flex min-h-screen flex-col items-center">
    <div class="backdrop" />

    <div class="relative z-10 w-full">
      <slot />
    </div>
  </main>

  <Footer />
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-color: var(--background);
  background-image: radial-gradient(color-mix(in srgb, var(--muted-foreground) 40%, transparent) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: radial-gradient(ellipse at center, black 40%, transparent 100%);
  animation: pulse-opacity 8s ease-in-out infinite;
}

@keyframes pulse-opacity {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.3;
  }
}
</style>
