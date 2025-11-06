<template>
  <nuxt-link :to="`/admin/${project.slug}`">
    <div class="card group hover:border-accent! relative h-[180px] w-full overflow-hidden">
      <div class="flex h-full flex-col gap-2 p-2">
        <h3 class="truncate">
          {{ project.name }}
        </h3>
        <p class="text-caption line-clamp-3">
          {{ project.description || 'No description provided.' }}
        </p>
      </div>

      <div class="navigation-group text-muted-foreground absolute bottom-4 left-4 gap-4">
        <nuxt-link :to="`/admin/${project.slug}/settings`" class="flex items-center">
          <icon name="ph:gear-bold" size="20" class="hover:scale-md hover:text-accent transition-all" />
        </nuxt-link>
        <div class="navigation-group">
          <icon name="ph:key-bold" size="20" />
          <span class="text-sm">{{ props.project.secrets?.length }}</span>
        </div>
      </div>

      <div class="bg-muted absolute right-4 bottom-4 flex items-center justify-center rounded-full p-2">
        <icon name="ph:arrow-right-bold" size="25" class="group-hover:scale-md group-hover:text-accent transition-all" />
      </div>
    </div>
  </nuxt-link>
</template>

<script setup lang="ts">
const props = defineProps<{
  project: Project
}>()
</script>
