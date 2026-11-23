<template>
  <TabSection title="Projects">
    <template #context>
      <h3 class="flex max-w-full min-w-0 items-center gap-1 text-muted-foreground">
        <span class="min-w-0 truncate">{{ activeOrg?.name }}</span>
        <nuxt-link
          v-if="activeOrg?.website" :href="activeOrg.website"
          target="_blank" class="shrink-0"
          aria-label="Visit organization website"
        >
          <icon name="ph:arrow-up-right-bold" size="15" class="hover:text-primary" />
        </nuxt-link>
      </h3>
    </template>

    <template #actions>
      <ProjectsActions
        :search="searchQuery" :layout="layout"
        :is-owner="isOwner" :is-admin="isAdmin"
        @update:search="searchQuery = $event" @update:layout="layout = $event"
        @toggle-sort="toggleSort" @open-dialog="dialog.open('projects')"
      />
    </template>

    <Empty v-if="!filteredProjects.length" message="No projects yet. Create one to get started." icon-name="ph:folder-simple-minus-bold" />

    <div v-else-if="layout === 'list'" class="flex max-h-screen">
      <ProjectsTable :projects="filteredProjects" />
    </div>

    <ul v-else class="scroll-area grid max-h-screen gap-2 overflow-y-auto p-2 md:grid-cols-3 2xl:grid-cols-4">
      <li
        v-for="(project, index) in filteredProjects" :key="project.id"
        v-motion :initial="{ opacity: 0, x: -10 }"
        :enter="{ opacity: 1, x: 0 }" :duration="500"
        :delay="Math.min(index * 50, 300)"
      >
        <ProjectsCard :project="project" />
      </li>

      <li
        v-if="isOwner || isAdmin" v-motion
        :initial="{ opacity: 0, x: -10 }" :enter="{ opacity: 1, x: 0 }"
        :duration="500" :delay="Math.min(filteredProjects.length * 50, 300) + 50"
      >
        <button type="button" class="group flex h-50 w-full flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed text-muted-foreground transition-all hover:border-secondary hover:bg-primary/10 hover:text-secondary" @click="dialog.open('projects')">
          <icon name="ph:plus-bold" size="50" class="transition-transform group-hover:scale-105" />
          <span class="text-caption transition-transform group-hover:scale-105">New Project</span>
        </button>
      </li>
    </ul>

    <ProjectsDialog @close="dialog.close('projects')" @save="handleCreateProject" />
  </TabSection>
</template>

<script setup lang="ts">
const { dialog } = useUI()
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
  dialog.close("projects")
}

// Persist layout mode in localStorage
watch(layout, (value) => {
  if (import.meta.client) {
    localStorage.setItem("layoutMode", value)
  }
})
</script>
