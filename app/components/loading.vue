<template>
  <div class="relative flex size-full items-center justify-center overflow-hidden">
    <!-- Background decorative cogwheels - large scattered -->
    <div class="absolute inset-0 opacity-50">
      <icon name="ph:gear-six" size="200" class="animate-spin-slow absolute -top-16 -left-16" />
      <icon name="ph:gear-fine" size="200" class="animate-spin-reverse absolute top-16 left-16" />
      <icon name="ph:gear" size="320" class="animate-spin-reverse absolute -top-20 -right-20" style="animation-duration: 5s" />
      <icon name="ph:gear-six" size="150" class="animate-spin-slow absolute right-32 bottom-10" style="animation-duration: 6s" />
      <icon name="ph:gear-six" size="150" class="animate-spin-reverse absolute -bottom-16 -left-10" style="animation-duration: 7s" />
      <icon name="ph:gear" size="120" class="animate-spin-slow absolute top-1/3 right-1/4" style="animation-duration: 8s" />
      <icon name="ph:gear" size="180" class="animate-spin-reverse absolute top-1/2 left-1/4" style="animation-duration: 4.5s" />
    </div>

    <!-- Mid-layer cogwheels -->
    <div class="absolute inset-0 opacity-50">
      <icon name="ph:gear" size="100" class="animate-spin-reverse absolute top-1/4 left-1/3" style="animation-duration: 4s" />
      <icon name="ph:gear-fine" size="100" class="animate-spin-slow absolute top-1/6 right-1/6" style="animation-duration: 5s" />
      <icon name="ph:gear-fine" size="100" class="animate-spin-slow absolute right-1/4 bottom-1/4" style="animation-duration: 6s" />
      <icon name="ph:gear" size="120" class="animate-spin-reverse absolute bottom-1/8 left-1/8" style="animation-duration: 3.5s" />
      <icon name="ph:gear-fine" size="100" class="animate-spin-reverse absolute bottom-1/12 left-1/4" style="animation-duration: 3.5s" />
    </div>

    <!-- Foreground layer with subtle gears -->
    <div class="absolute inset-0 opacity-30">
      <icon name="ph:gear-fine" size="200" class="animate-spin-slow absolute top-20 left-1/2" style="animation-duration: 3s" />
      <icon name="ph:gear" size="160" class="animate-spin-reverse absolute right-1/3 bottom-32" style="animation-duration: 4s" />
    </div>

    <!-- Main central content -->
    <div class="relative z-10 flex flex-col items-center justify-center gap-8 opacity-30">
      <div class="flex items-center justify-center gap-8">
        <icon name="ph:gear-fine" size="200" class="animate-spin-slow" />

        <div class="relative">
          <icon name="ph:gear-six" size="80" class="animate-spin-slow" style="animation-duration: 4.5s" />
          <icon name="ph:gear" size="20" class="animate-spin-reverse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style="animation-duration: 1.5s" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spin-reverse {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
  color: color-mix(in srgb, var(--color-muted-foreground) 60%, transparent);
}

.animate-spin-reverse {
  animation: spin-reverse 4s linear infinite;
  color: color-mix(in srgb, var(--color-muted-foreground) 50%, transparent);
}
</style>
