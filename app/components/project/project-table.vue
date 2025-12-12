<template>
  <div class="w-full overflow-x-auto">
    <table class="min-w-full table-auto rounded-t-lg border bg-card md:w-full md:overflow-hidden">
      <thead>
        <tr>
          <th class="header-cell">
            Name
          </th>
          <th class="header-cell">
            Description
          </th>
          <th class="header-cell">
            Secrets
          </th>
          <th class="header-cell">
            Members
          </th>
          <th class="header-cell">
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="project in projects" :key="project.id" class="cursor-pointer border text-sm hover:bg-muted" @click="$router.push(`/admin/${project.slug}`)">
          <td class="border p-2">
            {{ project.name }}
          </td>

          <td class="max-w-60 truncate border p-2 text-muted-foreground">
            {{ project.description || 'No description provided.' }}
          </td>

          <td class="border p-2">
            <div class="flex flex-row items-center gap-1 text-muted-foreground">
              <icon name="ph:key" size="20" />
              <span>{{ project.secrets?.length }}</span>
            </div>
          </td>

          <td class="border p-2">
            <div class="flex flex-row items-center gap-1 text-muted-foreground">
              <icon name="ph:users" size="20" />
              <span>{{ project.memberships?.length }}</span>
            </div>
          </td>

          <td class="border p-2">
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
