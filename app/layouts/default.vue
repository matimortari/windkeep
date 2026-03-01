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
  background-image: url("@/assets/backdrop.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  mask-image: radial-gradient(ellipse at center, black 80%, transparent 100%);
  filter: brightness(0.3);
}

html.light .backdrop {
  opacity: 0;
  animation: none;
}
</style>
