<template>
  <section class="container mx-auto flex flex-col gap-4">
    <header v-if="title" class="flex flex-col items-start gap-2 border-b py-4 md:flex-row md:items-center md:justify-between">
      <div class="flex flex-col gap-1">
        <h4>
          {{ title }}
        </h4>
        <p v-if="description" class="text-caption">
          {{ description }}
        </p>
      </div>

      <slot name="actions" />
    </header>

    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>
