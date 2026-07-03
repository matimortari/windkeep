<template>
  <!-- Mobile overlay -->
  <div v-if="isOpen" aria-hidden="true" class="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden" @click="emit('update:isOpen', false)" />

  <aside
    class="fixed top-0 left-0 z-40 flex h-screen w-64 transform flex-col gap-4 border-r bg-card px-4 py-20 transition-transform ease-in-out md:static md:z-20 md:rounded-br-lg md:border-b md:py-8"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
  >
    <p class="section-label">
      Organization
    </p>

    <nav class="flex flex-col gap-1 font-medium text-muted-foreground" aria-label="Organization Navigation">
      <button
        v-for="tab in ORGANIZATION_TABS" :key="tab.key"
        type="button" class="group navigation-group border-l-2 border-transparent p-2 text-left text-sm transition-all hover:border-primary hover:text-foreground 2xl:text-base"
        :class="{ 'textgnd border-primary!': isActiveOrgTab(tab.key) }"
        @click="selectOrgTab(tab.key)"
      >
        <icon :name="tab.icon" size="20" />
        <span>{{ tab.label }}</span>
      </button>
    </nav>

    <div class="flex items-center justify-between border-t pt-4">
      <p class="section-label">
        Projects
      </p>

      <div class="navigation-group">
        <button :aria-label="showAllProjects ? 'Show Projects Inside Organization' : 'Show All My Projects'" class="btn-ghost p-0!" @click="showAllProjects = !showAllProjects">
          <icon :name="showAllProjects ? 'ph:users-four-bold' : 'ph:user-bold'" size="20" />
        </button>
        <button aria-label="Create New Project" class="btn-ghost p-0!" @click="openDialog('projects')">
          <icon name="ph:plus-bold" size="20" />
        </button>
      </div>
    </div>

    <div class="scroll-area flex-1 overflow-y-auto">
      <div v-if="loading" class="flex flex-col gap-2" aria-hidden="true">
        <div v-for="i in 6" :key="i" class="h-3 animate-pulse rounded-sm bg-muted" :style="{ width: skeletonWidths[i - 1] }" />
      </div>

      <p v-else-if="!filteredProjects.length" class="text-caption">
        No projects yet.
      </p>

      <nav v-else aria-label="Projects Navigation" class="flex flex-col gap-2">
        <div v-for="project in filteredProjects" :key="project.id">
          <nuxt-link
            :to="`/admin/${project.slug}`" class="text-caption truncate border-l-2 border-transparent px-2 transition-all hover:border-primary hover:text-foreground"
            :class="{ 'border-primary! text-primary!': isActiveProject(project) }" @click="handleProjectClick(project)"
          >
            {{ project.name }}
          </nuxt-link>

          <div v-if="isActiveProject(project)" class="mt-1 ml-3 flex flex-col gap-0.5 border-l pl-2">
            <button
              v-for="tab in PROJECT_TABS" :key="tab.key"
              type="button" class="navigation-group rounded-sm p-1 text-left text-sm text-muted-foreground transition-all hover:text-foreground"
              :class="uiState.adminTabs.project === tab.key ? 'font-semibold text-primary!' : ''"
              @click="selectProjectTab(project, tab.key)"
            >
              <icon :name="tab.icon" size="15" />
              <span>{{ tab.label }}</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  </aside>

  <ProjectsDialog @close="closeDialog('projects')" @save="handleCreateProject" />
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
  loading?: boolean
}>()

const emit = defineEmits<{ "update:isOpen": [value: boolean] }>()

const route = useRoute()
const userStore = useUserStore()
const { activeOrg } = storeToRefs(useOrgStore())
const projectStore = useProjectStore()
const { projects } = storeToRefs(projectStore)
const { openDialog, closeDialog } = useUIState()
const { uiState, setTab, setActiveProject } = useUIState()
const showAllProjects = ref(false)
const skeletonWidths = ["65%", "45%", "60%", "50%", "50%", "60%"]

// All projects the user has access to, across all orgs
const allProjects = computed(() => projects.value.filter(project => project.memberships?.some(m => m.userId === userStore.user?.id)))

// Projects within the active org that the user has access to
const activeOrgProjects = computed(() => {
  if (!activeOrg.value?.id) {
    return []
  }

  return allProjects.value.filter(project => project.orgId === activeOrg.value?.id)
})

const filteredProjects = computed(() => showAllProjects.value ? allProjects.value : activeOrgProjects.value)

function isActiveProject(project: Project) {
  return route.path === `/admin/${project.slug}`
}

function isActiveOrgTab(tabKey: string) {
  return route.path === "/admin/organization" && uiState.adminTabs.organization === tabKey
}

function selectOrgTab(tabKey: string) {
  setTab("organization", tabKey)
  if (route.path !== "/admin/organization") {
    navigateTo("/admin/organization")
  }
  emit("update:isOpen", false)
}

function handleProjectClick(project: Project) {
  setActiveProject(project.slug)
  setTab("project", PROJECT_TABS[0]!.key)
  emit("update:isOpen", false)
}

function selectProjectTab(project: Project, tabKey: string) {
  setActiveProject(project.slug)
  setTab("project", tabKey)
  if (route.path !== `/admin/${project.slug}`) {
    navigateTo(`/admin/${project.slug}`)
  }
  emit("update:isOpen", false)
}

async function handleCreateProject(project: { name: string, description?: string }) {
  if (!activeOrg.value || !project.name) {
    return
  }

  await projectStore.createProject({ name: project.name, description: project.description || undefined, orgId: activeOrg.value.id })
  await projectStore.getProjects()
  closeDialog("projects")
}

// Keep the shared "current project" field in sync with the route
watch(() => route.params.project, (slug) => {
  setActiveProject(typeof slug === "string" ? slug : null)
}, { immediate: true })
</script>
