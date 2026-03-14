<template>
  <div class="flex size-full items-center justify-center" role="status">
    <div class="h-0.5 w-48 overflow-hidden rounded-full bg-muted">
      <div class="slide h-full w-1/3 rounded-full bg-primary" />
    </div>
  </div>
</template>

<style scoped>
.slide {
  animation: slide 1.4s ease-in-out infinite;
}

@keyframes slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}
</style>
