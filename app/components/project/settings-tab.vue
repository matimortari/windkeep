<template>
  <TabSection title="Settings" description="Manage project details and settings.">
    <div class="flex flex-col">
      <div v-for="(field, index) in projectFields" :key="index" class="flex flex-col justify-between gap-2 border-b py-4 last:border-b-0 md:navigation-group">
        <div class="flex flex-col items-start justify-center gap-1 text-start">
          <h6>{{ field.label }}</h6>
          <p v-if="field.description" class="text-caption">
            {{ field.description }}
          </p>
        </div>

        <div v-if="field.copyable" class="navigation-group justify-end">
          <span>{{ field.value }}</span>
          <button class="btn transition-transform" :aria-label="`Copy ${field.label} to Clipboard`" @click="copyIcon[index]?.triggerCopy(field.value?.value || '')">
            <icon :name="copyIcon[index]?.icon.value || 'ph:copy-bold'" size="20" />
          </button>
        </div>

        <div v-else-if="field.type === 'input' && field.editable" class="navigation-group justify-end">
          <input type="text" :value="field.model?.value" @input="field.update?.(($event.target as HTMLInputElement).value)">
          <button class="btn transition-transform" aria-label="Save Changes" @click="field.onSave(index)">
            <icon :name="saveIcon[index]?.icon.value || 'ph:floppy-disk-bold'" size="20" />
          </button>
        </div>

        <span v-else class="navigation-group justify-end">{{ field.value }}</span>
      </div>
    </div>

    <div class="flex flex-col gap-4 border-t pt-6">
      <p class="section-label">
        Danger Zone
      </p>

      <nav v-if="!isOwner(project?.id ?? '')" class="flex flex-col justify-between gap-4 border-b py-4 md:navigation-group" aria-label="Leave Project">
        <header class="flex flex-col gap-1">
          <h6>Leave Project</h6>
          <p class="text-caption-danger">
            This action is irreversible. You will no longer have access to this project.
          </p>
        </header>
        <button class="btn-danger self-end" aria-label="Leave Project" @click="handleLeaveProject">
          <icon name="ph:sign-out-bold" size="20" />
          <span>Confirm</span>
        </button>
      </nav>

      <nav v-if="isOwner(project?.id ?? '')" class="flex flex-col justify-between gap-4 py-4 md:navigation-group" aria-label="Delete Project">
        <header class="flex flex-col gap-1">
          <h6>Delete Project</h6>
          <p class="text-caption-danger">
            This action is irreversible. All data associated with this project will be permanently deleted.
          </p>
        </header>
        <button class="btn-danger self-end" aria-label="Delete Project" @click="handleDeleteProject">
          <icon name="ph:trash-bold" size="20" />
          <span>Confirm</span>
        </button>
      </nav>
    </div>
  </TabSection>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.project
const { createActionHandler } = useActionIcon()
const { user } = storeToRefs(useUserStore())
const projectStore = useProjectStore()
const { projects, isOwner } = storeToRefs(projectStore)
const project = computed(() => projects.value.find(p => p.slug === slug))
const localProject = ref<Project | null>(null)

const projectFields = [
  {
    label: "Project Name",
    description: "The name of your project.",
    type: "input",
    model: computed(() => localProject.value?.name ?? ""),
    update: (value: string) => {
      if (localProject.value) {
        localProject.value.name = value
      }
    },
    onSave: handleSubmit,
    editable: computed(() => isOwner.value(project.value?.id ?? "")),
  },
  {
    label: "Project ID",
    description: "This ID uniquely identifies your project.",
    value: computed(() => project.value?.id),
    copyable: true,
  },
  {
    label: "Project Slug",
    description: "This slug is used in the URL to access your project. Lowercase alphanumeric with hyphens only.",
    type: "input",
    model: computed(() => localProject.value?.slug ?? ""),
    update: (value: string) => {
      if (localProject.value) {
        localProject.value.slug = value
      }
    },
    onSave: handleSubmit,
    editable: computed(() => isOwner.value(project.value?.id ?? "")),
  },
  {
    label: "Project Website",
    description: "The official website for your project.",
    type: "input",
    model: computed(() => localProject.value?.website ?? ""),
    update: (value: string) => {
      if (localProject.value) {
        localProject.value.website = value
      }
    },
    onSave: handleSubmit,
    editable: computed(() => isOwner.value(project.value?.id ?? "")),
  },
  {
    label: "Project Description",
    description: "Briefly describe the purpose or content of this project.",
    type: "input",
    model: computed(() => localProject.value?.description ?? ""),
    update: (value: string) => {
      if (localProject.value) {
        localProject.value.description = value
      }
    },
    onSave: handleSubmit,
    editable: computed(() => isOwner.value(project.value?.id ?? "")),
  },
  {
    label: "Created At",
    description: "When your project was created.",
    value: computed(() => formatDate(project.value?.createdAt)),
  },
  {
    label: "Updated At",
    description: "When your project was last updated.",
    value: computed(() => formatDate(project.value?.updatedAt)),
  },
]

const copyIcon = projectFields.map(() => createActionHandler("ph:copy-bold"))
const saveIcon = projectFields.map(() => createActionHandler("ph:floppy-disk-bold"))

async function handleSubmit(index: number) {
  if (!project.value?.id) {
    return
  }
  await projectStore.updateProject(project.value.id, {
    name: localProject.value?.name ?? "",
    slug: localProject.value?.slug ?? "",
    description: localProject.value?.description || undefined,
    website: localProject.value?.website || undefined,
  })
  await projectStore.getProjects()
  saveIcon[index]?.triggerSuccess()
  if (project.value.slug !== localProject.value?.slug) {
    await navigateTo(`/admin/${localProject.value?.slug}`)
  }
}

async function handleDeleteProject() {
  if (!project.value?.id) {
    return
  }
  if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
    return
  }
  await projectStore.deleteProject(project.value.id)
  await navigateTo("/admin/organization")
}

async function handleLeaveProject() {
  if (!project.value?.id || !user.value?.id) {
    return
  }
  if (!confirm("Are you sure you want to leave this project? This action cannot be undone.")) {
    return
  }
  await projectStore.removeProjectMember(project.value.id, user.value.id)
  await navigateTo("/admin/organization")
}

// Keep local project state in sync with store
watch(() => project.value, (proj) => {
  if (!proj) {
    return
  }
  if (localProject.value) {
    localProject.value.name = proj.name
    localProject.value.slug = proj.slug
    localProject.value.description = proj.description
    localProject.value.website = proj.website
  }
  else {
    localProject.value = { ...proj }
  }
}, { immediate: true })
</script>
