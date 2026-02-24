<template>
  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1 }" :duration="800">
    <ProjectsActions
      :search="searchQuery" :layout="layout"
      :show-all="showAllProjects" :sort-direction="sortDirection || 'asc'"
      :is-owner="isOwner" :is-admin="isAdmin"
      @update:search="searchQuery = $event" @update:layout="layout = $event"
      @update:show-all="showAllProjects = $event" @toggle-sort="toggleSort"
      @open-dialog="isDialogOpen = true"
    />

    <Empty v-if="!filteredProjects.length" message="No projects yet. Create one to get started." icon-name="ph:folder-simple-minus" />

    <div v-else-if="layout === 'list'" class="flex max-h-screen">
      <ProjectsTable :projects="filteredProjects" />
    </div>

    <ul v-else class="scroll-area grid max-h-screen gap-2 overflow-y-auto p-2 md:grid-cols-3">
      <li
        v-for="(project, index) in filteredProjects" :key="project.id"
        v-motion :initial="{ opacity: 0 }"
        :enter="{ opacity: 1 }" :duration="600"
        :delay="200 * index"
      >
        <ProjectsCard :project="project" />
      </li>

      <button
        v-if="isOwner || isAdmin" v-motion
        :initial="{ opacity: 0 }" :enter="{ opacity: 1 }"
        :duration="600" class="card group flex h-50 flex-col items-center justify-center gap-4 border-dashed! bg-transparent! hover:border-primary!"
        @click="isDialogOpen = true"
      >
        <icon name="ph:plus" size="50" class="text-muted-foreground transition-transform group-hover:scale-110 group-hover:text-primary" />
        <span class="font-semibold text-muted-foreground transition-transform group-hover:scale-110">New Project</span>
      </button>
    </ul>

    <ProjectsDialog :is-open="isDialogOpen" @close="isDialogOpen = false" @save="handleCreateProject" />
  </div>
</template>

<script setup lang="ts">
const userStore = useUserStore()
const projectStore = useProjectStore()
const { activeOrg, isOwner, isAdmin } = storeToRefs(useOrgStore())
const { projects } = storeToRefs(projectStore)
const searchQuery = ref("")
const isDialogOpen = ref(false)
const showAllProjects = ref(false)
const layout = ref<"list" | "grid">((import.meta.client && localStorage.getItem("layoutMode") as "list" | "grid") || "grid")

// All projects the user has access to, across all orgs
const allProjects = computed(() => projects.value.filter(project => project.memberships?.some(m => m.userId === userStore.user?.id)))

// Projects within the active org that the user has access to
const activeOrgProjects = computed(() => {
  if (!activeOrg.value?.id) {
    return []
  }

  return projects.value.filter(project => project.orgId === activeOrg.value?.id && project.memberships?.some(m => m.userId === userStore.user?.id))
})

const { sortedData, sortDirection, sortKey, setSort } = useTableSort<Project>(computed(() => (showAllProjects.value ? allProjects.value : activeOrgProjects.value)))
const filteredProjects = computed(() => sortedData.value.filter(p => p.name.toLowerCase().includes(searchQuery.value.toLowerCase())))

function toggleSort() {
  if (sortKey.value !== "name") {
    setSort("name", "asc")
    return
  }

  setSort("name", sortDirection.value === "asc" ? "desc" : "asc")
}

async function handleCreateProject(project: { name: string, description?: string }) {
  if (!activeOrg.value) {
    return
  }

  try {
    await projectStore.createProject({ name: project.name, description: project.description || undefined, orgId: activeOrg.value.id })
    await projectStore.getProjects()
    isDialogOpen.value = false
  }
  catch {
    // Silently fail
  }
}

// Persist layout mode in localStorage
watch(layout, (value) => {
  if (import.meta.client) {
    localStorage.setItem("layoutMode", value)
  }
})

useHead({
  title: "Projects",
  link: [{ rel: "canonical", href: `${BASE_URL}/admin/projects` }],
  meta: [{ name: "description", content: "WindKeep projects page." }],
})

definePageMeta({
  layout: "admin",
  middleware: "auth",
})
</script>
