<template>
  <div class="relative flex size-full items-center justify-center overflow-hidden" role="status">
    <span class="sr-only">Loading...</span>
    <!-- Background decorative cogwheels, large and scattered -->
    <div class="absolute inset-0 opacity-20" aria-hidden="true">
      <icon name="ph:gear-six-bold" size="200" class="absolute -top-16 -left-16 animate-spin" />
      <icon name="ph:gear-fine-bold" size="200" class="animate-spin-reverse absolute top-16 left-16 hidden xl:block" />
      <icon name="ph:gear-bold" size="320" class="animate-spin-reverse absolute -top-20 -right-20" />
      <icon name="ph:gear-six-bold" size="150" class="absolute right-32 bottom-10 hidden animate-spin xl:block" />
      <icon name="ph:gear-six-bold" size="150" class="animate-spin-reverse absolute -bottom-16 -left-10" />
      <icon name="ph:gear-bold" size="120" class="absolute top-1/3 right-1/4 hidden animate-spin xl:block" />
      <icon name="ph:gear-bold" size="180" class="animate-spin-reverse absolute top-1/2 left-1/4" />
    </div>

    <!-- Mid-layer cogwheels -->
    <div class="absolute inset-0 opacity-20" aria-hidden="true">
      <icon name="ph:gear-bold" size="100" class="animate-spin-reverse absolute top-1/4 left-1/3" />
      <icon name="ph:gear-fine-bold" size="100" class="absolute right-1/4 bottom-1/4 hidden animate-spin xl:block" />
      <icon name="ph:gear-bold" size="120" class="animate-spin-reverse absolute bottom-1/10 left-1/10 hidden xl:block" />
      <icon name="ph:gear-fine-bold" size="100" class="animate-spin-reverse absolute bottom-1/12 left-1/5 hidden xl:block" />
    </div>

    <!-- Foreground cogwheels -->
    <icon name="ph:gear-fine-bold" size="200" class="absolute top-4 left-1/2 hidden animate-spin opacity-20 xl:block" aria-hidden="true" />
    <icon name="ph:gear-fine-bold" size="220" class="relative hidden animate-spin opacity-30 xl:block" aria-hidden="true" />
  </div>
</template>
