<template>
  <TabSection title="Projects">
    <template #context>
      <h3 class="flex max-w-lg flex-row items-center gap-1 truncate text-muted-foreground">
        <span class="truncate">{{ activeOrg?.name }}</span>
        <nuxt-link v-if="activeOrg?.website" :href="activeOrg.website" target="_blank" aria-label="Visit organization website">
          <icon name="ph:arrow-up-right-bold" size="15" class="hover:text-primary" />
        </nuxt-link>
      </h3>
    </template>

    <template #actions>
      <ProjectsActions
        :search="searchQuery" :layout="layout"
        :is-owner="isOwner" :is-admin="isAdmin"
        @update:search="searchQuery = $event" @update:layout="layout = $event"
        @toggle-sort="toggleSort" @open-dialog="openDialog('projects')"
      />
    </template>

    <Empty v-if="!filteredProjects.length" message="No projects yet. Create one to get started." icon-name="ph:folder-simple-minus-bold" />

    <div v-else-if="layout === 'list'" class="flex max-h-screen">
      <ProjectsTable :projects="filteredProjects" />
    </div>

    <ul
      v-else v-motion
      :initial="{ opacity: 0 }" :enter="{ opacity: 1 }"
      :duration="600" class="scroll-area grid max-h-screen gap-2 overflow-y-auto p-2 md:grid-cols-3 2xl:grid-cols-4"
    >
      <li v-for="project in filteredProjects" :key="project.id">
        <ProjectsCard :project="project" />
      </li>

      <button v-if="isOwner || isAdmin" type="button" class="card group flex h-50 flex-col items-center justify-center gap-4 border-2! border-dashed! bg-transparent! text-muted-foreground" @click="openDialog('projects')">
        <icon name="ph:plus-bold" size="50" class="transition-transform group-hover:scale-105 group-hover:text-secondary" />
        <span class="font-semibold transition-transform group-hover:scale-105">New Project</span>
      </button>
    </ul>

    <ProjectsDialog @close="closeDialog('projects')" @save="handleCreateProject" />
  </TabSection>
</template>

<script setup lang="ts">
const { closeDialog, openDialog } = useUIState()
const projectStore = useProjectStore()
const { activeOrg, isOwner, isAdmin, orgProjects } = storeToRefs(useOrgStore())
const searchQuery = ref("")
const layout = ref<"list" | "grid">((import.meta.client && localStorage.getItem("layoutMode") as "list" | "grid") || "grid")
const { sortedData, sortDirection, sortKey, setSort } = useTableSort<Project>(orgProjects)
const filteredProjects = computed(() => sortedData.value.filter(p => p.name.toLowerCase().includes(searchQuery.value.toLowerCase())))

function toggleSort() {
  if (sortKey.value !== "name") {
    setSort("name", "asc")
    return
  }

  setSort("name", sortDirection.value === "asc" ? "desc" : "asc")
}

async function handleCreateProject(project: { name: string, description?: string }) {
  if (!activeOrg.value || !project.name) {
    return
  }

  await projectStore.createProject({ name: project.name, description: project.description || undefined, orgId: activeOrg.value.id })
  await projectStore.getProjects()
  closeDialog("projects")
}

// Persist layout mode in localStorage
watch(layout, (value) => {
  if (import.meta.client) {
    localStorage.setItem("layoutMode", value)
  }
})
</script>
