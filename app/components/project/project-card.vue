<template>
  <nuxt-link :to="`/admin/${project.slug}`">
    <div class="card relative flex h-50 w-full flex-col justify-between overflow-hidden hover:border-primary!">
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
          <div class="flex flex-row items-center gap-1 text-sm font-semibold text-muted-foreground">
            <icon name="ph:key" size="20" />
            <span>{{ project.secrets?.length }}</span>
          </div>

          <div class="flex flex-row items-center gap-1 text-sm font-semibold text-muted-foreground">
            <icon name="ph:users" size="20" />
            <span>{{ project.memberships?.length }}</span>
          </div>
        </div>

        <div class="navigation-group">
          <nuxt-link :to="`/admin/${project.slug}/settings`" title="Project Settings" class="group navigation-group rounded-full p-2 text-muted-foreground transition-colors">
            <icon name="ph:gear" size="25" class="transition-transform group-hover:text-primary" />
            <span class="text-caption hidden whitespace-nowrap 2xl:block">Settings</span>
          </nuxt-link>

          <div class="group navigation-group rounded-full p-2 text-muted-foreground transition-colors">
            <span class="text-caption hidden whitespace-nowrap 2xl:block">View Project</span>
            <icon name="ph:arrow-right" size="25" class="transition-transform group-hover:text-primary" />
          </div>
        </div>
      </div>
    </div>
  </nuxt-link>
</template>

<script setup lang="ts">
defineProps<{
  project: Project
}>()
</script>
