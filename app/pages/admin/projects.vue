<template>
  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1 }" :duration="800">
    <header class="navigation-group border-b py-4">
      <h2>
        Projects
      </h2>

      <nav class="navigation-group w-full flex-1 justify-end">
        <div class="relative hidden md:block">
          <input id="search" v-model="searchQuery" type="text" placeholder="Search projects...">
          <span class="absolute inset-y-0 right-0 flex flex-row items-center pr-4 text-muted-foreground">
            <icon name="ph:magnifying-glass" size="20" />
          </span>
        </div>

        <button class="btn" @click="toggleNameSort">
          <icon name="ph:arrow-down" size="20" class="transition-transform" :class="sortDirection === 'asc' ? 'rotate-180' : 'rotate-0'" />
        </button>

        <button aria-label="Toggle Layout" class="btn" @click="layout = layout === 'grid' ? 'list' : 'grid'">
          <icon :name="layout === 'grid' ? 'ph:list-bullets' : 'ph:squares-four'" size="20" />
        </button>

        <button class="btn" :title="showAllProjects ? 'Show Projects Inside Organization' : 'Show All My Projects'" @click="showAllProjects = !showAllProjects">
          <Icon :name="showAllProjects ? 'ph:users-four' : 'ph:user'" size="20" />
        </button>

        <button class="btn-primary" @click="isDialogOpen = true">
          <span class="hidden md:inline">Add New Project</span>
          <icon name="ph:plus" size="20" />
        </button>
      </nav>
    </header>

    <Empty v-if="!filteredProjects.length" message="No projects yet. Create one to get started." icon-name="ph:folder-simple-minus" />

    <div v-else-if="layout === 'list'" class="scroll-area max-h-[80vh] overflow-y-auto">
      <ProjectTable :projects="filteredProjects" />
    </div>

    <ul v-else class="scroll-area grid max-h-[80vh] gap-2 overflow-y-auto md:grid-cols-3">
      <li
        v-for="(project, index) in filteredProjects" :key="project.id"
        v-motion :initial="{ opacity: 0 }"
        :enter="{ opacity: 1 }" :duration="600"
        :delay="200 * index"
      >
        <ProjectCard :project="project" />
      </li>

      <button
        v-motion :initial="{ opacity: 0 }"
        :enter="{ opacity: 1 }" :duration="600"
        class="card group flex h-50 flex-col items-center justify-center gap-4 border-dashed! bg-transparent! hover:border-primary!" @click="isDialogOpen = true"
      >
        <icon name="ph:plus" size="50" class="text-muted-foreground transition-transform group-hover:scale-110 group-hover:text-primary" />
        <span class="text-caption transition-transform group-hover:scale-110">Add New Project...</span>
      </button>
    </ul>

    <ProjectDialog :is-open="isDialogOpen" @close="isDialogOpen = false" @save="handleCreateProject" />
  </div>
</template>

<script setup lang="ts">
const projectStore = useProjectStore()
const { activeOrg } = storeToRefs(useOrgStore())
const userStore = useUserStore()
const { projects } = storeToRefs(projectStore)
const searchQuery = ref("")
const isDialogOpen = ref(false)
const showAllProjects = ref(false)
const layout = ref<"list" | "grid">((import.meta.client && localStorage.getItem("layoutMode") as "list" | "grid") || "grid")

// Projects in the active organization that the user has access to
const activeOrgProjects = computed(() => {
  if (!activeOrg.value?.id) {
    return []
  }

  return projects.value.filter(
    project => project.orgId === activeOrg.value?.id && project.memberships?.some(m => m.userId === userStore.user?.id),
  )
})

// All projects the user has access to, across all orgs
const allProjects = computed(() => {
  return projects.value.filter(project =>
    project.memberships?.some(m => m.userId === userStore.user?.id),
  )
})

const { sortedData: sortedProjects, sortDirection, sortKey, setSort } = useTableSort<Project>(computed(() => (showAllProjects.value ? allProjects.value : activeOrgProjects.value)))
const filteredProjects = computed(() => sortedProjects.value.filter(project => project.name.toLowerCase().includes(searchQuery.value.toLowerCase())))

function toggleNameSort() {
  if (sortKey.value !== "name") {
    setSort("name", "asc")
    return
  }

  setSort("name", sortDirection.value === "asc" ? "desc" : "asc")
}

async function handleCreateProject(payload: { name: string, slug: string, description: string }) {
  if (!activeOrg.value) {
    return
  }

  await projectStore.createProject({
    name: payload.name,
    slug: payload.slug,
    description: payload.description || undefined,
    orgId: activeOrg.value.id,
  })

  await projectStore.getProjects()
  isDialogOpen.value = false
}

watch(() => activeOrg.value?.id, async (orgId) => {
  if (orgId) {
    await projectStore.getProjects()
  }
}, { immediate: true })

watch(layout, (newLayout) => {
  if (import.meta.client) {
    localStorage.setItem("layoutMode", newLayout)
  }
})

useHead({
  title: "Projects",
  link: [{ rel: "canonical", href: "https://windkeep.vercel.app/admin/projects" }],
  meta: [{ name: "description", content: "WindKeep projects page." }],
})

definePageMeta({
  layout: "admin",
  middleware: auth,
})
</script>
