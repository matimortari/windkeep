<template>
  <nuxt-link :to="`/admin/${project.slug}`">
    <div class="card relative flex h-50 w-full flex-col justify-between overflow-hidden">
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
            <icon name="ph:key-bold" size="20" />
            <span>{{ project.secrets?.length }}</span>
          </div>

          <div class="flex flex-row items-center gap-1 text-sm font-semibold text-muted-foreground">
            <icon name="ph:users-bold" size="20" />
            <span>{{ project.memberships?.length }}</span>
          </div>
        </div>

        <div class="navigation-group">
          <nuxt-link :to="`/admin/${project.slug}/settings`" title="Project Settings" class="group btn-ghost rounded-full!" @click.stop>
            <icon name="ph:gear-bold" size="25" class="text-muted-foreground group-hover:text-primary" />
            <span class="text-caption hidden whitespace-nowrap xl:block">Settings</span>
          </nuxt-link>

          <div class="group btn-ghost rounded-full!">
            <icon name="ph:arrow-right-bold" size="25" class="text-muted-foreground group-hover:text-primary" />
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
