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

          <td class="line-clamp-3" :title="project.description || 'No description provided.'">
            {{ project.description || 'No description provided.' }}
          </td>

          <td>
            <div class="navigation-group">
              <icon name="ph:key" size="20" />
              <span>{{ project.secrets?.length }}</span>
            </div>
          </td>

          <td>
            <div class="navigation-group">
              <icon name="ph:users" size="20" />
              <span>{{ project.memberships?.length }}</span>
            </div>
          </td>

          <td>
            <div class="navigation-group text-muted-foreground">
              <nuxt-link :to="`/admin/${project.slug}/settings`" title="Settings">
                <icon name="ph:gear" size="20" class="hover:text-primary" />
              </nuxt-link>
              <nuxt-link :to="`/admin/${project.slug}`" title="Open">
                <icon name="ph:arrow-right" size="20" class="hover:text-primary" />
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
  { key: "name", label: "Name", class: "w-32", sortable: true },
  { key: "description", label: "Description", sortable: false },
  { key: "secrets", label: "Secrets", class: "w-10", sortable: true },
  { key: "members", label: "Members", class: "w-10", sortable: true },
  { key: "actions", label: "Actions", class: "w-24", sortable: false },
]
</script>
