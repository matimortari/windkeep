<template>
  <TabSection title="Settings">
    <template #context>
      <h3 class="flex max-w-full min-w-0 items-center gap-1 text-muted-foreground">
        <span class="min-w-0 truncate">{{ project?.name }}</span>
        <nuxt-link
          v-if="project?.website" :href="project.website"
          target="_blank" class="shrink-0"
          aria-label="Visit project website"
        >
          <icon name="ph:arrow-up-right-bold" size="15" class="hover:text-primary" />
        </nuxt-link>
      </h3>
    </template>

    <div class="flex flex-col">
      <div v-for="(field, index) in projectFields" :key="index" class="flex flex-col justify-between gap-4 border-b py-4 last:border-b-0 md:navigation-group">
        <div class="flex flex-col items-start justify-center gap-1 text-start">
          <h6>
            {{ field.label }}
          </h6>
          <p v-if="field.description" class="text-caption">
            {{ field.description }}
          </p>
        </div>

        <div v-if="field.copyable" class="navigation-group flex-1 justify-end md:max-w-72">
          <span>{{ field.value }}</span>
          <button type="button" class="btn transition-transform" :aria-label="`Copy ${field.label} to Clipboard`" @click="copyIcon[index]?.triggerCopy(field.value?.value || '')">
            <icon :name="copyIcon[index]?.icon.value || 'ph:copy-bold'" size="20" />
          </button>
        </div>

        <div v-else-if="field.type === 'input' && field.editable" class="navigation-group flex-1 justify-end md:max-w-72">
          <input type="text" :value="field.model?.value" @input="field.update?.(($event.target as HTMLInputElement).value)">
          <button type="button" class="btn transition-transform" aria-label="Save Changes" @click="field.onSave(index)">
            <icon :name="saveIcon[index]?.icon.value || 'ph:floppy-disk-bold'" size="20" />
          </button>
        </div>

        <span v-else class="navigation-group flex-1 justify-end md:max-w-72">{{ field.value }}</span>
      </div>
    </div>
  </TabSection>

  <TabSection title="Danger Zone">
    <nav v-if="isOwner(project?.id ?? '')" class="flex flex-col justify-between gap-4 border-b py-4 md:navigation-group" aria-label="Transfer Project Ownership">
      <header class="flex flex-col gap-1">
        <h6>
          Transfer Ownership
        </h6>
        <p class="text-caption-danger">
          The selected member becomes the project owner. The current owner is demoted to admin.
        </p>
      </header>

      <div class="navigation-group w-full justify-end md:w-auto">
        <div ref="transferDropdownRef" class="relative min-w-0 flex-1 md:w-64 md:flex-none">
          <button
            type="button" class="btn w-full justify-between"
            :disabled="!transferCandidates.length"
            aria-haspopup="listbox" :aria-expanded="isTransferDropdownOpen"
            aria-label="Select new owner" @click="isTransferDropdownOpen = !isTransferDropdownOpen"
          >
            <span class="navigation-group min-w-0 flex-1">
              <img v-if="transferTarget?.user.image" :src="transferTarget.user.image" alt="Avatar" class="size-5 rounded-full border">
              <span class="truncate">{{ transferTarget ? transferTarget.user.name : (transferCandidates.length ? "Select new owner" : "No eligible members") }}</span>
            </span>
            <icon name="ph:caret-down-bold" size="20" class="shrink-0" :class="isTransferDropdownOpen ? 'rotate-180' : 'rotate-0'" />
          </button>

          <transition name="dropdown">
            <ul v-if="isTransferDropdownOpen && transferCandidates.length" class="dropdown-menu max-h-60 w-full" role="listbox">
              <li v-for="member in transferCandidates" :key="member.userId" role="presentation">
                <button
                  type="button" role="option"
                  :aria-selected="transferTargetId === member.userId" class="navigation-group w-full truncate rounded-lg p-2 text-left hover:bg-muted/60"
                  :class="transferTargetId === member.userId ? 'bg-muted' : ''"
                  @click="transferTargetId = member.userId; isTransferDropdownOpen = false"
                >
                  <img v-if="member.user.image" :src="member.user.image" alt="Avatar" class="size-6 rounded-full border">
                  <div class="flex flex-col truncate">
                    <span class="truncate font-semibold">{{ member.user.name }}</span>
                    <span class="text-xs text-muted-foreground">{{ member.user.email }}</span>
                  </div>
                </button>
              </li>
            </ul>
          </transition>
        </div>
        <button
          type="button" class="btn-warning shrink-0"
          aria-label="Transfer Project Ownership" :disabled="!transferTargetId"
          @click="handleTransferOwnership"
        >
          <icon name="ph:swap-bold" size="20" />
          <span>Transfer</span>
        </button>
      </div>
    </nav>

    <nav v-if="canLeaveProject(project?.id ?? '')" class="flex flex-col justify-between gap-4 border-b py-4 md:navigation-group" aria-label="Leave Project">
      <header class="flex flex-col gap-1">
        <h6>
          Leave Project
        </h6>
        <p class="text-caption-danger">
          This action is irreversible. You will no longer have access to this project.
        </p>
      </header>
      <button type="button" class="btn-danger self-end" aria-label="Leave Project" @click="handleLeaveProject">
        <icon name="ph:sign-out-bold" size="20" />
        <span>Confirm</span>
      </button>
    </nav>

    <nav v-if="isOwner(project?.id ?? '')" class="flex flex-col justify-between gap-4 py-4 md:navigation-group" aria-label="Delete Project">
      <header class="flex flex-col gap-1">
        <h6>
          Delete Project
        </h6>
        <p class="text-caption-danger">
          This action is irreversible. All data associated with this project will be permanently deleted.
        </p>
      </header>
      <button type="button" class="btn-danger self-end" aria-label="Delete Project" @click="handleDeleteProject">
        <icon name="ph:trash-bold" size="20" />
        <span>Confirm</span>
      </button>
    </nav>
  </TabSection>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.project
const { user } = storeToRefs(useUserStore())
const projectStore = useProjectStore()
const { projects, isOwner, membershipRole } = storeToRefs(projectStore)
const { confirm } = useUI()
const project = computed(() => projects.value.find((p: Project) => p.slug === slug))
const localProject = ref<Project | null>(null)
const transferTargetId = ref("")
const isTransferDropdownOpen = ref(false)
const transferDropdownRef = ref<HTMLElement | null>(null)
useClickOutside(transferDropdownRef, () => isTransferDropdownOpen.value = false, { escapeKey: true })

const transferCandidates = computed(() => (project.value?.memberships ?? []).filter((m: ProjectMembership) => m.role !== "OWNER" && m.userId !== user.value?.id))
const transferTarget = computed(() => transferCandidates.value.find((m: ProjectMembership) => m.userId === transferTargetId.value))
const canLeaveProject = computed(() => (projectId: string) => !!membershipRole.value(projectId) && membershipRole.value(projectId) !== "OWNER")

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
]

const copyIcon = projectFields.map(() => useActionIcon("ph:copy-bold"))
const saveIcon = projectFields.map(() => useActionIcon("ph:floppy-disk-bold"))

async function handleSubmit(index: number) {
  if (!project.value?.id) {
    return
  }
  await projectStore.updateProject(project.value.id, {
    name: localProject.value?.name ?? "",
    slug: localProject.value?.slug ?? "",
    description: localProject.value?.description?.trim() ? localProject.value.description.trim() : null,
    website: localProject.value?.website?.trim() ? localProject.value.website.trim() : null,
  })
  await projectStore.getProjects()
  saveIcon[index]?.triggerSuccess()
  if (project.value.slug !== localProject.value?.slug) {
    await navigateTo(`/admin/${localProject.value?.slug}`)
  }
}

async function handleTransferOwnership() {
  if (!project.value?.id || !transferTargetId.value) {
    return
  }
  const target = transferCandidates.value.find((m: ProjectMembership) => m.userId === transferTargetId.value)
  if (!await confirm({ title: "Transfer Ownership", message: `Transfer ownership of this project to ${target?.user.name ?? "this member"}? The current project owner will be demoted to admin.`, confirmLabel: "Transfer", variant: "warning" })) {
    return
  }
  await projectStore.transferProjectOwnership(project.value.id, { newOwnerId: transferTargetId.value })
  transferTargetId.value = ""
}

async function handleDeleteProject() {
  if (!project.value?.id) {
    return
  }
  if (!await confirm({ title: "Delete Project", message: "Are you sure you want to delete this project? This action cannot be undone.", confirmLabel: "Delete", variant: "danger" })) {
    return
  }
  await projectStore.deleteProject(project.value.id)
  await navigateTo("/admin/organization")
}

async function handleLeaveProject() {
  if (!project.value?.id || !user.value?.id) {
    return
  }
  if (!await confirm({ title: "Leave Project", message: "Are you sure you want to leave this project? This action cannot be undone.", confirmLabel: "Leave", variant: "danger" })) {
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
  transferTargetId.value = ""
  isTransferDropdownOpen.value = false
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
