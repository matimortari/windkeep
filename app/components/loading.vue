<template>
  <div class="relative flex size-full items-center justify-center overflow-hidden">
    <!-- Background decorative cogwheels, large and scattered -->
    <div class="absolute inset-0 opacity-20">
      <icon name="ph:gear-six" size="200" class="absolute -top-16 -left-16 animate-spin" />
      <icon name="ph:gear-fine" size="200" class="animate-spin-reverse absolute top-16 left-16 hidden xl:block" />
      <icon name="ph:gear" size="320" class="animate-spin-reverse absolute -top-20 -right-20" />
      <icon name="ph:gear-six" size="150" class="absolute right-32 bottom-10 hidden animate-spin xl:block" />
      <icon name="ph:gear-six" size="150" class="animate-spin-reverse absolute -bottom-16 -left-10" />
      <icon name="ph:gear" size="120" class="absolute top-1/3 right-1/4 hidden animate-spin xl:block" />
      <icon name="ph:gear" size="180" class="animate-spin-reverse absolute top-1/2 left-1/4" />
    </div>

    <!-- Mid-layer cogwheels -->
    <div class="absolute inset-0 opacity-20">
      <icon name="ph:gear" size="100" class="animate-spin-reverse absolute top-1/4 left-1/3" />
      <icon name="ph:gear-fine" size="100" class="absolute right-1/4 bottom-1/4 hidden animate-spin xl:block" />
      <icon name="ph:gear" size="120" class="animate-spin-reverse absolute bottom-1/8 left-1/8 hidden xl:block" />
      <icon name="ph:gear-fine" size="100" class="animate-spin-reverse absolute bottom-1/12 left-1/4 hidden xl:block" />
    </div>

    <!-- Foreground cogwheels -->
    <icon name="ph:gear-fine" size="200" class="absolute top-10 left-1/2 hidden animate-spin opacity-20 xl:block" />
    <icon name="ph:gear-fine" size="220" class="relative z-10 hidden animate-spin opacity-30 xl:block" />
  </div>
</template>

<style scoped>
@keyframes spin {
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

.animate-spin {
  animation: spin 16s linear infinite;
  color: color-mix(in srgb, var(--color-muted-foreground) 60%, transparent);
}

.animate-spin-reverse {
  animation: spin-reverse 8s linear infinite;
  color: color-mix(in srgb, var(--color-muted-foreground) 50%, transparent);
}
</style>
