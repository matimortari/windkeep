<template>
  <header class="navigation-group border-b py-2">
    <h2>
      Projects
    </h2>

    <nav class="navigation-group w-full flex-1 justify-end">
      <div class="relative hidden md:block">
        <input
          id="search" :value="search"
          type="text" placeholder="Search projects..."
          @input="emit('update:search', ($event.target as HTMLInputElement).value)"
        >
        <span class="absolute inset-y-0 right-0 flex flex-row items-center pr-4 text-muted-foreground">
          <icon name="ph:magnifying-glass" size="20" />
        </span>
      </div>

      <button class="btn" :title="`Sort by Name ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`" @click="emit('toggleSort')">
        <icon name="ph:arrow-down" size="20" class="transition-transform" :class="sortDirection === 'asc' ? 'rotate-180' : 'rotate-0'" />
      </button>

      <button title="Toggle Layout" class="btn" @click="emit('update:layout', layout === 'grid' ? 'list' : 'grid')">
        <icon :name="layout === 'grid' ? 'ph:list-bullets' : 'ph:squares-four'" size="20" />
      </button>

      <button class="btn" :title="showAll ? 'Show Projects Inside Organization' : 'Show All My Projects'" @click="emit('update:show-all', !showAll)">
        <icon :name="showAll ? 'ph:users-four' : 'ph:user'" size="20" />
      </button>

      <button v-if="isOwner || isAdmin" class="btn-primary" @click="emit('openDialog')">
        <span class="hidden md:inline">New Project</span>
        <icon name="ph:plus" size="20" />
      </button>
    </nav>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  search: string
  layout: "grid" | "list"
  showAll: boolean
  sortDirection: "asc" | "desc"
  isOwner: boolean
  isAdmin: boolean
}>()

const emit = defineEmits<{
  "update:search": [value: string]
  "update:layout": [value: "grid" | "list"]
  "update:show-all": [value: boolean]
  "toggleSort": []
  "openDialog": []
}>()
</script>
