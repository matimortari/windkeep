<template>
  <div class="flex flex-col items-center justify-center gap-4 py-12 text-center text-muted-foreground">
    <div class="rounded-md bg-muted p-4 text-muted-foreground">
      <icon :name="iconName || 'ph:empty'" :size="iconSize || 25" />
    </div>

    <h4>
      {{ message }}
    </h4>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  iconName: string
  iconSize?: number
}>()
</script>
