<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" :class="col.class">
            <div class="navigation-group">
              <span>{{ col.label }}</span>
              <button v-if="col.sortable" class="flex items-center hover:text-primary" :aria-label="`Sort by ${col.label}`" @click="toggleSort(col.key)">
                <icon :name="getSortIconName(col.key)" size="15" class="transition-transform" />
              </button>
            </div>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="project in sortedProjects" :key="project.id" class="cursor-pointer hover:bg-muted/20" @click="$router.push(`/admin/${project.slug}`)">
          <td>
            {{ project.name }}
          </td>
          <td class="max-w-md overflow-visible!">
            <span class="group/tooltip relative inline-flex max-w-full">
              <span class="truncate">{{ project.description || 'No description provided.' }}</span>
              <span class="card pointer-events-none absolute bottom-full left-0 z-50 w-max p-1! text-xs! opacity-0 transition-opacity group-hover/tooltip:opacity-100">
                {{ project.description || 'No description provided.' }}
              </span>
            </span>
          </td>
          <td>
            <div class="navigation-group">
              <icon name="ph:key-bold" size="20" />
              <span>{{ project.secrets?.length }}</span>
            </div>
          </td>
          <td>
            <div class="navigation-group">
              <icon name="ph:users-bold" size="20" />
              <span>{{ project.memberships?.length }}</span>
            </div>
          </td>
          <td>
            <div class="navigation-group">
              <nuxt-link :to="`/admin/${project.slug}/settings`" aria-label="Project Settings" @click.stop>
                <icon name="ph:gear-bold" size="20" class="transition-colors hover:text-primary" />
              </nuxt-link>
              <nuxt-link :to="`/admin/${project.slug}`" aria-label="Open Project" @click.stop>
                <icon name="ph:arrow-right-bold" size="20" class="transition-colors hover:text-primary" />
              </nuxt-link>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  projects: Project[]
}>()

const { sortedData: sortedProjects, toggleSort, getSortIconName } = useTableSort<Project>(toRef(props, "projects"))

const columns = [
  { key: "name", label: "Name", class: "w-40", sortable: true },
  { key: "description", label: "Description", class: "", sortable: false },
  { key: "secrets", label: "Secrets", class: "w-24", sortable: true },
  { key: "members", label: "Members", class: "w-24", sortable: true },
  { key: "actions", label: "Actions", class: "w-24", sortable: false },
]
</script>
