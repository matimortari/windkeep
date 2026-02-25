<template>
  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1 }" :duration="800">
    <header class="navigation-group border-b py-2">
      <nuxt-link :to="`/admin/${project?.slug}`" aria-label="Go back" class="flex items-center">
        <icon name="ph:arrow-left-bold" size="30" class="text-muted-foreground hover:text-primary" />
      </nuxt-link>
      <h2 class="max-w-lg truncate">
        {{ project?.name }}
      </h2>
    </header>

    <section class="flex flex-col">
      <div class="gap-2 border-b p-4 md:navigation-group">
        <header class="flex flex-col gap-2">
          <h3>
            Project Details
          </h3>
          <p class="text-caption">
            Manage project details and settings.
          </p>
        </header>

        <p v-if="Object.values(errors).some(Boolean)" class="text-caption-danger">
          {{ Object.values(errors).find(Boolean) }}
        </p>
      </div>

      <!-- Project Details -->
      <div v-for="(field, index) in projectFields" :key="index" class="flex flex-col justify-between gap-4 border-b p-4 md:navigation-group md:px-10">
        <div class="flex flex-col items-start justify-center gap-1 text-start">
          <h5>
            {{ field.label }}
          </h5>
          <p v-if="field.description" class="text-caption">
            {{ field.description }}
          </p>
        </div>

        <div v-if="field.copyable" class="navigation-group justify-end">
          <span>{{ field.value }}</span>
          <button
            class="btn transition-transform" title="Copy to Clipboard"
            aria-label="Copy to Clipboard" @click="copyIcon[index]?.triggerCopy(field.value?.value || '')"
          >
            <icon :name="copyIcon[index]?.icon.value || 'ph:copy-bold'" size="20" />
          </button>
        </div>

        <div v-else-if="field.type === 'input'" class="navigation-group justify-end">
          <input type="text" :value="field.model?.value" @input="field.update?.(($event.target as HTMLInputElement).value)">
          <button class="btn transition-transform" aria-label="Save Changes" @click="field.onSave(index)">
            <icon :name="saveIcon[index]?.icon.value || 'ph:floppy-disk-bold'" size="20" />
          </button>
        </div>

        <span v-else class="navigation-group justify-end">{{ field.value }}</span>
      </div>

      <!-- Project Members List -->
      <section class="flex flex-col justify-between gap-2 border-b p-4 md:px-10">
        <h5>
          Project Members
        </h5>

        <ul class="scroll-area card flex max-h-52 flex-col items-start overflow-y-auto">
          <li v-for="member in project?.memberships" :key="member.userId" class="navigation-group w-full justify-between border-y py-2 first:border-t-0 first:pt-0 last:border-b-0 last:pb-0">
            <div class="navigation-group items-start!">
              <img :src="member.user.image || DEFAULT_AVATAR" alt="Avatar" class="hidden size-8 rounded-full border-2 md:block">

              <div class="flex flex-col truncate">
                <span class="font-semibold">{{ member.user?.name }}</span>
                <span class="text-caption">Role: {{ capitalizeFirst(member.role) }}</span>
              </div>
            </div>

            <nav v-if="(isOwner(project?.id ?? '') || isAdmin(project?.id ?? '')) && member.userId !== user?.id && member.role !== 'OWNER'" class="navigation-group" aria-label="Project Member Actions">
              <select v-model="member.role">
                <option v-for="role in ROLES.filter(r => r.value !== 'OWNER')" :key="role.value" :value="role.value">
                  {{ capitalizeFirst(role.label) }}
                </option>
              </select>

              <button class="btn" aria-label="Update Member Role" @click="handleUpdateMemberRole(member.userId, member.role)">
                <icon :name="memberRoleIcon.get(member.userId)?.icon || 'ph:floppy-disk-bold'" size="15" />
              </button>
              <button v-if="isOwner(project?.id ?? '') && String(member.role) !== 'OWNER'" class="btn" aria-label="Remove Member" @click="handleRemoveMember(member.userId)">
                <icon name="ph:x-bold" size="15" />
              </button>
            </nav>
          </li>
        </ul>
      </section>
    </section>

    <!-- Add New Member -->
    <section v-if="isOwner(project?.id ?? '') || isAdmin(project?.id ?? '')" class="flex flex-col justify-between gap-4 border-b p-4 md:navigation-group md:px-10" aria-label="Add New Member">
      <header class="flex flex-col gap-1">
        <h5>
          Add New Member
        </h5>
        <p class="text-caption">
          Invite users to join this project.
        </p>
      </header>

      <div class="flex flex-col gap-1 md:navigation-group">
        <div v-if="availableOrgMembers.length" ref="addMemberDropdownRef" class="relative navigation-group">
          <button class="btn w-full justify-between md:w-auto" @click="isAddMemberDropdownOpen = !isAddMemberDropdownOpen">
            <span class="truncate">{{ selectedMemberToAdd ? availableOrgMembers.find(m => m.user.id === selectedMemberToAdd)?.user.name : 'Select a member...' }}</span>
            <icon name="ph:caret-down-bold" size="20" :class="[isAddMemberDropdownOpen ? 'rotate-180' : 'rotate-0']" />
          </button>

          <transition name="dropdown">
            <ul v-if="isAddMemberDropdownOpen" class="dropdown-menu left-0 max-h-60 w-full md:w-80" role="menu">
              <li v-for="member in availableOrgMembers" :key="member.user.id" class="truncate whitespace-nowrap">
                <button class="navigation-group w-full truncate rounded-lg p-2 text-left hover:bg-muted/60" :class="selectedMemberToAdd === member.user.id ? 'bg-muted' : ''" @click="selectedMemberToAdd = member.user.id; isAddMemberDropdownOpen = false">
                  <img :src="member.user.image || DEFAULT_AVATAR" alt="Avatar" class="size-6 rounded-full border">
                  <div class="flex flex-col truncate">
                    <span class="truncate font-semibold">{{ member.user.name }}</span>
                    <span class="text-xs text-muted-foreground">{{ member.user.email }}</span>
                  </div>
                </button>
              </li>
            </ul>
          </transition>

          <select v-model="newMemberRole" class="md:min-w-30">
            <option v-for="role in ROLES.filter(r => r.value !== 'OWNER')" :key="role.value" :value="role.value">
              {{ capitalizeFirst(role.label) }}
            </option>
          </select>
        </div>

        <p v-else class="text-muted-foreground">
          No available members to add.
        </p>

        <div v-if="availableOrgMembers.length" class="navigation-group self-end">
          <p v-if="errors.addProjectMember || addMemberSuccess" :class="errors.addProjectMember ? 'text-caption-danger' : 'text-caption-success'">
            {{ errors.addProjectMember || addMemberSuccess }}
          </p>
          <button class="btn-primary" aria-label="Add Member" @click.prevent="handleAddMember">
            <icon name="ph:plus-circle-bold" size="20" />
            <span>Add Member</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Danger Zone -->
    <section class="flex flex-col">
      <header class="flex flex-col items-start gap-2 border-b p-4 text-start">
        <h3>
          Danger Zone
        </h3>
        <p class="text-caption">
          This section contains actions that can significantly affect your account. Please proceed with caution.
        </p>
      </header>

      <nav v-if="!isOwner(project?.id ?? '')" class="flex flex-col justify-between gap-4 border-b p-4 md:navigation-group md:px-10" aria-label="Leave Project">
        <header class="flex flex-col gap-1">
          <h5>
            Leave Project
          </h5>
          <p class="text-caption-danger">
            This action is irreversible. You will no longer have access to this project.
          </p>
        </header>

        <button class="btn-danger self-end" aria-label="Leave Project" @click="handleLeaveProject">
          <icon name="ph:sign-out-bold" size="20" />
          <span>Confirm</span>
        </button>
      </nav>

      <nav v-if="isOwner(project?.id ?? '')" class="flex flex-col justify-between gap-4 border-b p-4 md:navigation-group md:px-10" aria-label="Delete Project">
        <header class="flex flex-col gap-1">
          <h5>
            Delete Project
          </h5>
          <p class="text-caption-danger">
            This action is irreversible. All data associated with this project will be permanently deleted.
          </p>
        </header>

        <button class="btn-danger self-end" aria-label="Delete Project" @click="handleDeleteProject">
          <icon name="ph:trash-bold" size="20" />
          <span>Confirm</span>
        </button>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.project
const { createActionHandler } = useActionIcon()
const { user } = storeToRefs(useUserStore())
const orgStore = useOrgStore()
const { orgMembers } = storeToRefs(orgStore)
const projectStore = useProjectStore()
const { projects, isOwner, isAdmin, errors } = storeToRefs(projectStore)
const project = computed(() => projects.value.find(p => p.slug === slug))
const addMemberSuccess = ref<string | null>(null)
const selectedMemberToAdd = ref<string>("")
const newMemberRole = ref(ROLES[0]?.value ?? "MEMBER")
const localProject = ref<Project | null>(null)
const isAddMemberDropdownOpen = ref(false)
const addMemberDropdownRef = ref<HTMLElement | null>(null)

const availableOrgMembers = computed(() => {
  if (!project.value || !orgMembers.value) {
    return []
  }

  return orgMembers.value.filter(member => !new Set(project.value?.memberships?.map(m => m.userId) || []).has(member.user.id))
})

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
    editable: isOwner,
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
    editable: isOwner,
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
    editable: isOwner,
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
const memberRoleIcon = ref(new Map())

useClickOutside(addMemberDropdownRef, () => {
  isAddMemberDropdownOpen.value = false
}, { escapeKey: true })

async function handleAddMember() {
  addMemberSuccess.value = null
  if (!project.value?.id || !selectedMemberToAdd.value) {
    return
  }

  await projectStore.addProjectMember(project.value.id, {
    userId: selectedMemberToAdd.value,
    role: newMemberRole.value as "ADMIN" | "MEMBER",
  })

  await projectStore.getProjects()
  addMemberSuccess.value = "Member added successfully."
  selectedMemberToAdd.value = ""
  newMemberRole.value = ROLES[0]?.value ?? "MEMBER"
}

async function handleUpdateMemberRole(memberId: string, newRole: "ADMIN" | "MEMBER") {
  if (!project.value?.id) {
    return
  }

  await projectStore.updateProjectMember(project.value.id, memberId, { role: newRole })
  await projectStore.getProjects()
  memberRoleIcon.value.get(memberId)?.triggerSuccess()
}

async function handleRemoveMember(memberId: string) {
  if (!project.value?.id) {
    return
  }
  if (!confirm("Are you sure you want to remove this member?")) {
    return
  }

  await projectStore.removeProjectMember(project.value.id, memberId)
  await projectStore.getProjects()
}

async function handleSubmit(index: number) {
  if (!project.value?.id) {
    return
  }

  const oldSlug = project.value.slug
  const newSlug = localProject.value?.slug ?? ""
  await projectStore.updateProject(project.value.id, {
    name: localProject.value?.name ?? "",
    slug: localProject.value?.slug ?? "",
    description: localProject.value?.description ?? "",
  })

  await projectStore.getProjects()
  saveIcon[index]?.triggerSuccess()
  if (oldSlug !== newSlug) {
    await navigateTo(`/admin/${newSlug}/settings`)
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
  await navigateTo("/admin/projects")
}

async function handleLeaveProject() {
  if (!project.value?.id || !user.value?.id) {
    return
  }
  if (!confirm("Are you sure you want to leave this project? This action cannot be undone.")) {
    return
  }

  await projectStore.removeProjectMember(project.value.id, user.value.id)
  await navigateTo("/admin/projects")
}

// Initialize action handlers for members
watch(() => project.value?.memberships, (memberships) => {
  if (!memberships) {
    return
  }
  memberships.forEach((member) => {
    if (!memberRoleIcon.value.has(member.userId)) {
      memberRoleIcon.value.set(member.userId, createActionHandler("ph:floppy-disk-bold"))
    }
  })
}, { immediate: true, deep: true })

// Keep local project state in sync with store
watch(() => project.value, (proj) => {
  if (!proj) {
    return
  }

  if (localProject.value) {
    localProject.value.name = proj.name
    localProject.value.slug = proj.slug
    localProject.value.description = proj.description || ""
  }
  else {
    localProject.value = { ...proj }
  }
}, { immediate: true })

// Set page metadata when project changes
watch(() => project.value?.id, async (id: string | undefined) => {
  const projectTitle = projects.value.find(p => p.id === id)?.name

  useHead({
    title: `${projectTitle} settings`,
    link: [{ rel: "canonical", href: `${BASE_URL}/${id}/settings` }],
    meta: [{ name: "description", content: `${projectTitle} project settings page.` }],
  })
}, { immediate: true })

definePageMeta({
  layout: "admin",
  middleware: "auth",
})
</script>
