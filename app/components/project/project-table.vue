<template>
  <div class="scroll-area max-h-[80vh] overflow-y-auto p-4!">
    <table class="w-full table-auto border-separate border-spacing-y-2">
      <thead class="bg-muted text-left text-sm text-muted-foreground">
        <tr>
          <th class="px-4 py-2">
            Name
          </th>
          <th class="px-4 py-2">
            Description
          </th>
          <th class="px-4 py-2">
            Secrets
          </th>
          <th class="px-4 py-2">
            Members
          </th>
          <th class="px-4 py-2 text-end">
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="project in projects" :key="project.id" class="card cursor-pointer transition hover:bg-muted" @click="$router.push(`/admin/${project.slug}`)">
          <td class="px-4 py-3 font-medium">
            {{ project.name }}
          </td>

          <td class="px-4 py-3 text-muted-foreground">
            {{ project.description || 'No description provided.' }}
          </td>

          <td class="px-4 py-3">
            <div class="flex flex-row items-center gap-1 text-muted-foreground">
              <icon name="ph:key-bold" size="20" />
              <span>{{ project.secrets?.length }}</span>
            </div>
          </td>

          <td class="px-4 py-3">
            <div class="flex flex-row items-center gap-1 text-muted-foreground">
              <icon name="ph:users-bold" size="20" />
              <span>{{ project.roles?.length }}</span>
            </div>
          </td>

          <td class="px-4 py-3">
            <div class="flex justify-end gap-2">
              <nuxt-link :to="`/admin/${project.slug}/settings`" class="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Settings" @click.stop>
                <icon name="ph:gear-bold" size="20" />
              </nuxt-link>

              <nuxt-link :to="`/admin/${project.slug}`" class="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Open" @click.stop>
                <icon name="ph:arrow-right-bold" size="20" />
              </nuxt-link>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  projects: Project[]
}>()
</script>
