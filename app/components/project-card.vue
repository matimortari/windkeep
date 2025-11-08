<template>
  <nuxt-link :to="`/admin/${project.slug}`">
    <div class="card group hover:border-accent! relative h-[180px] w-full overflow-hidden">
      <div class="flex flex-col gap-2 p-2">
        <h3 class="truncate">
          {{ project.name }}
        </h3>
        <p class="text-caption line-clamp-3">
          {{ project.description || 'No description provided.' }}
        </p>
      </div>

      <nuxt-link :to="`/admin/${project.slug}/settings`" class="text-caption absolute top-4 right-4" title="Project Settings">
        <icon name="ph:gear-bold" size="25" class="hover:text-accent transition-transform group-hover:scale-110 hover:scale-125" />
      </nuxt-link>

      <div class="text-caption absolute bottom-4 left-4 flex flex-row items-center gap-1">
        <icon name="ph:key-bold" size="20" />
        <span>{{ props.project.secrets?.length }}</span>
      </div>

      <div class="bg-muted absolute right-4 bottom-4 flex items-center justify-center rounded-full p-2">
        <icon name="ph:arrow-right-bold" size="25" class="group-hover:text-accent transition-transform group-hover:scale-125" />
      </div>
    </div>
  </nuxt-link>
</template>

<script setup lang="ts">
const props = defineProps<{
  project: Project
}>()
</script>
