<template>
  <!-- Mobile overlay -->
  <div v-if="isOpen" aria-hidden="true" class="fixed inset-0 z-20 bg-black/80 md:hidden" @click="emit('update:isOpen', false)" />

  <aside
    class="fixed top-0 left-0 z-40 flex h-screen w-64 transform flex-col gap-4 border-r-2 bg-card px-4 py-20 transition-transform ease-in-out md:static md:z-20 md:rounded-br-lg md:border-b-2 md:py-8 2xl:w-72"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
  >
    <p class="section-label">
      Overview
    </p>

    <nav class="flex flex-col gap-1 font-semibold text-muted-foreground" aria-label="Main Navigation">
      <nuxt-link
        v-for="link in SIDEBAR_NAV_LINKS" :key="link.url"
        :to="link.url" class="group navigation-group border-l-2 border-transparent p-2 text-sm transition-all hover:border-primary hover:text-foreground 2xl:text-base"
        :class="{ 'border-primary! text-foreground': route.path === link.url }"
        @click="emit('update:isOpen', false)"
      >
        <icon :name="link.icon" size="20" />
        <span>{{ link.label }}</span>
      </nuxt-link>
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
        <nuxt-link
          v-for="project in filteredProjects" :key="project.id"
          :to="`/admin/${project.slug}`"
          class="text-caption truncate border-l-2 border-transparent px-2 transition-all hover:border-primary hover:text-foreground"
          :class="{ 'border-primary! text-primary!': route.path === `/admin/${project.slug}` || route.path === `/admin/${project.slug}/settings` }"
          @click="emit('update:isOpen', false)"
        >
          {{ project.name }}
        </nuxt-link>
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
const showAllProjects = ref(false)
const skeletonWidths = ["65%", "45%", "60%", "50%", "50%", "60%"]

// All projects the user has access to, across all orgs
const allProjects = computed(() => projects.value.filter(project => project.memberships?.some(m => m.userId === userStore.user?.id)))

// Projects within the active org that the user has access to
const activeOrgProjects = computed(() => {
  if (!activeOrg.value?.id) {
    return []
  }

  return projects.value.filter(project => project.orgId === activeOrg.value?.id && project.memberships?.some(m => m.userId === userStore.user?.id))
})

const filteredProjects = computed(() => showAllProjects.value ? allProjects.value : activeOrgProjects.value)

async function handleCreateProject(project: { name: string, description?: string }) {
  if (!activeOrg.value || !project.name) {
    return
  }

  try {
    await projectStore.createProject({ name: project.name, description: project.description || undefined, orgId: activeOrg.value.id })
    await projectStore.getProjects()
    closeDialog("projects")
  }
  catch {
    // Silently fail
  }
}
</script>
