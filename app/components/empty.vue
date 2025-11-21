<template>
  <div class="flex flex-row items-center justify-center gap-4 py-12 text-center text-muted-foreground">
    <icon :name="iconName || 'ph:empty'" :size="iconSize || 25" />

    <p class="text-caption">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  iconName: string
  iconSize?: number
}>()
</script>
