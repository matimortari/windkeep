<template>
  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1 }" :duration="800">
    <header class="navigation-group border-b py-2">
      <h2>
        My Projects
      </h2>

      <nav class="navigation-group w-full flex-1 justify-end">
        <div class="relative hidden md:block">
          <input
            id="search" v-model="searchQuery"
            type="text" placeholder="Search projects..."
            class="w-full pr-10"
          >
          <span class="absolute inset-y-0 right-0 flex flex-row items-center pr-4 text-muted-foreground">
            <icon name="ph:magnifying-glass-bold" size="20" />
          </span>
        </div>

        <button aria-label="Sort by Name" class="btn" @click="sort.direction = sort.direction === 'asc' ? 'desc' : 'asc'">
          <icon
            name="ph:arrow-down-bold" size="20"
            title="Sort by Name" class="transition-transform"
            :class="[sort.direction === 'asc' ? 'rotate-180' : 'rotate-0']"
          />
        </button>

        <button class="btn-primary" aria-label="Add New Project" @click="isDialogOpen = true">
          <span class="hidden md:inline">Add New Project</span>
          <icon name="ph:plus-bold" size="20" />
        </button>
      </nav>
    </header>

    <p v-if="!filteredProjects.length" class="text-caption my-8 h-[80vh] text-center">
      No projects found. Create a new project to get started.
    </p>

    <ul v-else class="scroll-area grid max-h-[80vh] gap-2 overflow-y-auto p-4! md:grid-cols-3">
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
        class="card group flex h-[200px] flex-col items-center justify-center gap-4 border-dashed! bg-transparent!"
        aria-label="Add New Project" @click="isDialogOpen = true"
      >
        <icon name="ph:plus-bold" size="50" class="text-muted-foreground transition-transform group-hover:scale-110 group-hover:text-accent" />
        <span class="text-caption transition-transform group-hover:scale-110">Add New Project...</span>
      </button>
    </ul>

    <ProjectDialog :is-open="isDialogOpen" @close="isDialogOpen = false" @save="handleCreateProject" />
  </div>
</template>

<script setup lang="ts">
const { activeOrg } = useUserActions()
const { activeOrgProjects, createProject, fetchProjects } = useProjectActions()

const searchQuery = ref("")
const isDialogOpen = ref(false)
const sort = ref<{ key: string, direction: "asc" | "desc" }>({
  key: "name",
  direction: "asc",
})

const filteredProjects = computed(() => {
  const filtered = activeOrgProjects.value.filter(project =>
    typeof project.name === "string" && project.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )

  return [...filtered].sort((a, b) => {
    const nameA = a.name.toLowerCase()
    const nameB = b.name.toLowerCase()
    return sort.value.direction === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
  })
})

async function handleCreateProject(payload: { name: string, slug: string, description: string }) {
  await createProject({
    name: payload.name,
    slug: payload.slug,
    description: payload.description || undefined,
    organizationId: activeOrg.value!.id,
  })
  if (activeOrg.value?.id) {
    await fetchProjects()
  }
  isDialogOpen.value = false
}

watch(activeOrg, async (newOrg) => {
  if (newOrg) {
    await fetchProjects()
  }
}, { immediate: true })

useHead({
  title: "Projects",
  link: [{ rel: "canonical", href: "https://secretkeepr.vercel.app/admin/projects" }],
  meta: [{ name: "description", content: "SecretkeepR projects page." }],
})

definePageMeta({
  layout: "admin",
  middleware: auth,
})
</script>
