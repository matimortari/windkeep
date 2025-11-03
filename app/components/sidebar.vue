<template>
  <div v-if="isOpen" class="fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden" @click="$emit('update:isOpen', false)" />

  <aside
    class="bg-background fixed top-0 left-0 z-30 flex h-screen w-64 flex-col gap-2 overflow-y-auto border-r-2 p-4 transition-all md:static md:rounded-br-xl md:border-b-2 2xl:w-72 2xl:p-8"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
  >
    <span class="font-semibold">Overview</span>
    <nav class="text-muted-foreground flex flex-col gap-1 py-2 text-sm font-semibold" aria-label="Main Navigation">
      <nuxt-link v-for="link in SIDEBAR_NAV_LINKS" :key="link.url" :to="link.url" class="navigation-group hover:bg-muted rounded p-2">
        <icon :name="link.icon" size="30" />
        <span>{{ link.label }}</span>
      </nuxt-link>
    </nav>

    <div class="navigation-group justify-between">
      <span class="font-semibold">Projects</span>
      <button class="hover:scale-md hover:text-accent transition-all" aria-label="Create New Project" @click="isDialogOpen = true">
        <icon name="ph:plus-bold" size="25" />
      </button>
    </div>

    <p v-if="!projectsFromOrg.length" class="text-muted-foreground py-2 text-sm">
      No projects yet.
    </p>

    <nav v-else aria-label="Projects Navigation" class="scroll-area flex max-h-64 flex-col gap-2 overflow-x-hidden">
      <nuxt-link v-for="project in projectsFromOrg" :key="project.id" :to="`/admin/${project.slug}`" class="text-caption truncate hover:underline">
        {{ project.name }}
      </nuxt-link>
    </nav>

    <nuxt-link
      to="https://github.com/matimortari/secretkeepr" class="navigation-group group border-t py-4"
      rel="noopener" target="_blank"
      aria-label="GitHub Repository"
    >
      <icon name="simple-icons:github" size="25" class="group-hover:scale-md group-hover:text-accent transition-all" />
      <span class="text-muted-foreground text-sm font-semibold">
        Support This Project
      </span>
    </nuxt-link>
  </aside>

  <ProjectDialog :is-open="isDialogOpen" @close="isDialogOpen = false" @save="handleCreateProject" />
</template>

<script setup lang="ts">
const props = defineProps<{
  org?: Pick<Organization, "id" | "name"> & { role?: Role }
  isOpen: boolean
}>()

defineEmits(["update:isOpen"])

const { allProjects, createProject, fetchProjects } = useProjectActions()

const isDialogOpen = ref(false)

const projectsFromOrg = computed(() => {
  if (!props.org?.id)
    return []

  return allProjects.value.filter(
    project => project.organizationId === props.org!.id && typeof project.name === "string",
  )
})

async function handleCreateProject(project: { name: string, slug: string, description: string }) {
  await createProject({
    name: project.name,
    slug: project.slug,
    description: project.description || undefined,
    organizationId: props.org!.id,
  })
  if (props.org?.id) {
    await fetchProjects()
  }
  isDialogOpen.value = false
}
</script>

<style scoped>
.scroll-area {
  scrollbar-color: var(--muted) transparent;
  direction: rtl;
}
.scroll-area > * {
  direction: ltr;
}
</style>
