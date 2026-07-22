<template>
  <nav class="navigation-group w-full justify-end md:w-auto">
    <div class="relative min-w-0 flex-1 md:flex-none">
      <input
        id="search" :value="search"
        type="text" placeholder="Search projects..."
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
      >
      <span class="absolute inset-y-0 right-0 flex flex-row items-center pr-4 text-muted-foreground">
        <icon name="ph:magnifying-glass-bold" size="20" />
      </span>
    </div>

    <button type="button" aria-label="Toggle Layout" class="btn shrink-0" @click="emit('update:layout', layout === 'grid' ? 'list' : 'grid')">
      <icon :name="layout === 'grid' ? 'ph:list-bullets-bold' : 'ph:squares-four-bold'" size="20" />
    </button>

    <button v-if="isOwner || isAdmin" type="button" class="btn-primary shrink-0" @click="emit('openDialog')">
      <span class="hidden md:inline">New Project</span>
      <icon name="ph:plus-bold" size="20" />
    </button>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  search: string
  layout: "grid" | "list"
  isOwner: boolean
  isAdmin: boolean
}>()

const emit = defineEmits<{
  "update:search": [value: string]
  "update:layout": [value: "grid" | "list"]
  "openDialog": []
}>()
</script>
