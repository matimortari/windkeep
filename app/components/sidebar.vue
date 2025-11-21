<template>
  <div v-if="isOpen" class="fixed inset-0 z-40 bg-black/50 transition-opacity ease-in-out md:hidden" @click="$emit('update:isOpen', false)" />

  <aside
    class="fixed top-0 left-0 z-50 flex h-screen w-64 transform flex-col gap-2 overflow-y-auto border-r-2 bg-card px-4 py-8 transition-transform ease-in-out md:static md:z-20 md:rounded-br-xl md:border-b-2 2xl:w-72"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
  >
    <span class="font-semibold">Overview</span>
    <nav class="text-caption flex flex-col gap-1 py-2" aria-label="Main Navigation">
      <nuxt-link
        v-for="link in SIDEBAR_NAV_LINKS" :key="link.url"
        :to="link.url" class="group navigation-group rounded p-2 transition-colors hover:bg-muted"
        @click="$emit('update:isOpen', false)"
      >
        <icon :name="link.icon" size="30" class="transition-transform group-hover:scale-110" />
        <span>{{ link.label }}</span>
      </nuxt-link>
    </nav>

    <div class="flex flex-row items-center justify-between">
      <span class="font-semibold">Projects</span>
      <button class="transition-transform hover:scale-125 hover:text-accent" aria-label="Create New Project" @click="isDialogOpen = true">
        <icon name="ph:plus-bold" size="25" />
      </button>
    </div>

    <Empty v-if="!activeOrgProjects.length" message="No projects yet." icon-name="ph:folder-simple-minus-bold" :icon-size="30" />

    <nav v-else aria-label="Projects Navigation" class="scroll-area text-caption flex max-h-64 flex-col gap-2 overflow-x-hidden">
      <nuxt-link
        v-for="project in activeOrgProjects" :key="project.id"
        :to="`/admin/${project.slug}`" class="truncate hover:underline"
        @click="$emit('update:isOpen', false)"
      >
        {{ project.name }}
      </nuxt-link>
    </nav>

    <nuxt-link
      to="https://github.com/matimortari/secretkeepr" target="_blank"
      class="group navigation-group border-t py-4 transition-colors hover:underline" aria-label="GitHub Repository"
    >
      <icon name="simple-icons:github" size="25" class="transition-transform group-hover:scale-110 group-hover:text-accent" />
      <span class="text-caption">Support This Project</span>
    </nuxt-link>
  </aside>

  <ProjectDialog :is-open="isDialogOpen" @close="isDialogOpen = false" @save="handleCreateProject" />
</template>

<script setup lang="ts">
import type { CreateProjectInput } from "#shared/schemas/project-schema"

const props = defineProps<{
  org?: Organization
  isOpen: boolean
}>()

defineEmits(["update:isOpen"])

const { activeOrgProjects, createProject, fetchProjects } = useProjectActions()

const isDialogOpen = ref(false)

async function handleCreateProject(project: Omit<CreateProjectInput, "orgId">) {
  await createProject({
    name: project.name,
    slug: project.slug,
    description: project.description || undefined,
    orgId: props.org!.id,
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
