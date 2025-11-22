<template>
  <div class="scroll-area overflow-y-auto p-4!">
    <table class="min-w-full table-auto border-spacing-y-2 rounded-t-lg md:w-full md:overflow-hidden">
      <thead class="bg-muted text-left text-sm text-muted-foreground">
        <tr>
          <th class="cell">
            Name
          </th>
          <th class="cell">
            Description
          </th>
          <th class="cell">
            Secrets
          </th>
          <th class="cell">
            Members
          </th>
          <th class="cell text-end">
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="project in projects" :key="project.id" class="cursor-pointer transition-all hover:bg-muted" @click="$router.push(`/admin/${project.slug}`)">
          <td class="cell">
            {{ project.name }}
          </td>

          <td class="cell max-w-[250px] truncate text-muted-foreground">
            {{ project.description || 'No description provided.' }}
          </td>

          <td class="cell">
            <div class="flex flex-row items-center gap-1 text-muted-foreground">
              <icon name="ph:key" size="20" />
              <span>{{ project.secrets?.length }}</span>
            </div>
          </td>

          <td class="cell">
            <div class="flex flex-row items-center gap-1 text-muted-foreground">
              <icon name="ph:users" size="20" />
              <span>{{ project.memberships?.length }}</span>
            </div>
          </td>

          <td class="cell">
            <div class="flex justify-end gap-2">
              <nuxt-link :to="`/admin/${project.slug}/settings`" class="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Settings" @click.stop>
                <icon name="ph:gear" size="20" />
              </nuxt-link>

              <nuxt-link :to="`/admin/${project.slug}`" class="rounded-full p-2 text-muted-foreground hover:bg-muted" title="Open" @click.stop>
                <icon name="ph:arrow-right" size="20" />
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
