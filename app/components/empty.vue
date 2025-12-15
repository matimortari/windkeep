<template>
  <div class="flex flex-col items-center justify-center gap-4 py-12 text-center text-muted-foreground">
    <div class="rounded-sm bg-muted p-4">
      <icon :name="iconName || 'ph:empty'" :size="30" />
    </div>

    <h4 class="max-w-sm">
      {{ message }}
    </h4>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  iconName: string
}>()
</script>
