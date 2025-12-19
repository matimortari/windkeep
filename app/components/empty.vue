<template>
  <div class="flex flex-col items-center justify-center gap-4 py-12 text-center text-muted-foreground">
    <div class="rounded-sm bg-muted p-4">
      <icon :name="iconName || 'ph:empty'" :size="30" />
    </div>

    <p class="max-w-md text-lg leading-5 font-semibold">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  iconName: string
}>()
</script>
