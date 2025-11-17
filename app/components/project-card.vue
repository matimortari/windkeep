<template>
  <nuxt-link :to="`/admin/${project.slug}`">
    <div class="card relative flex h-[200px] w-full flex-col justify-between overflow-hidden">
      <div class="flex flex-col gap-2">
        <h3 class="truncate">
          {{ project.name }}
        </h3>
        <p class="text-caption line-clamp-3">
          {{ project.description || 'No description provided.' }}
        </p>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex flex-row items-center gap-4">
          <div class="flex flex-row items-center gap-1 text-muted-foreground">
            <icon name="ph:key-bold" size="20" />
            <span>{{ props.project.secrets?.length }}</span>
          </div>

          <div class="flex flex-row items-center gap-1 text-muted-foreground">
            <icon name="ph:users-bold" size="20" />
            <span>{{ project.roles?.length }}</span>
          </div>
        </div>

        <div class="navigation-group">
          <nuxt-link :to="`/admin/${project.slug}/settings`" title="Project Settings" class="group navigation-group rounded-full p-2 text-muted-foreground hover:bg-muted">
            <icon name="ph:gear-bold" size="25" class="transition-transform group-hover:scale-110 group-hover:text-accent" />
            <span class="text-caption hidden whitespace-nowrap 2xl:block">Settings</span>
          </nuxt-link>

          <div class="group navigation-group rounded-full p-2 text-muted-foreground hover:bg-muted">
            <span class="text-caption hidden whitespace-nowrap 2xl:block">View Project</span>
            <icon name="ph:arrow-right-bold" size="25" class="transition-transform group-hover:scale-110 group-hover:text-accent" />
          </div>
        </div>
      </div>
    </div>
  </nuxt-link>
</template>

<script setup lang="ts">
const props = defineProps<{
  project: Project
}>()
</script>
