<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4">
    <div class="relative w-1/4 bg-muted">
      <div class="progress-bar bg-primary" />
    </div>
  </div>
</template>

<style scoped>
.progress-bar {
  height: 4px;
  animation: progress 2s ease infinite;
}

@keyframes progress {
  0% {
    width: 0%;
  }
  10% {
    width: 10%;
  }
  50% {
    width: 40%;
  }
  60% {
    width: 60%;
  }
  100% {
    width: 100%;
  }
}
</style>
