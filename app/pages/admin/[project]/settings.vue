<template>
  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1 }" :duration="800">
    <header class="navigation-group border-b py-4">
      <nuxt-link :to="`/admin/${project?.slug}`" aria-label="Go back" class="flex items-center">
        <icon name="ph:arrow-left-bold" size="30" class="text-muted-foreground hover:text-accent" />
      </nuxt-link>
      <h2 class="max-w-lg truncate">
        {{ project?.name }}
      </h2>
    </header>

    <section class="flex flex-col">
      <div class="md:navigation-group gap-2 border-b p-4">
        <header class="flex flex-col gap-2">
          <h3>
            Project Details
          </h3>
          <p class="text-caption">
            Manage project details and settings.
          </p>
        </header>

        <p v-if="Object.values(errors).some(Boolean)" class="text-danger">
          {{ Object.values(errors).find(Boolean) }}
        </p>
      </div>

      <div v-for="(field, index) in projectFields" :key="index" class="md:navigation-group flex flex-col justify-between gap-2 border-b p-4 md:px-10">
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
          <input
            class="w-full"
            type="text"
            :value="field.model?.value"
            @input="field.update?.(($event.target as HTMLInputElement).value)"
          >
          <button class="btn transition-transform" aria-label="Save Changes" @click="field.onSave(index)">
            <icon :name="saveIcon[index]?.icon.value || 'ph:floppy-disk-bold'" size="20" />
          </button>
        </div>

        <span v-else class="navigation-group justify-end">{{ field.value }}</span>
      </div>

      <!-- Project Members List -->
      <section class="flex flex-col justify-between border-b p-4 md:px-10">
        <h5>
          Project Members
        </h5>

        <ul class="scroll-area flex max-h-52 flex-col items-start gap-1 overflow-y-auto">
          <li v-for="member in project?.roles" :key="member.userId" class="card navigation-group w-full justify-between overflow-hidden">
            <div class="flex min-w-0 flex-row items-center gap-4">
              <img :src="member.user?.image ?? undefined" alt="Avatar" class="hidden size-12 rounded-full border-2 md:block">

              <div class="flex min-w-0 flex-col">
                <span class="truncate">{{ member.user?.name }}</span>
                <span class="text-caption truncate">Role: {{ capitalizeFirst(member.role) }}</span>
                <span class="text-caption truncate">{{ member.userId }}</span>
              </div>
            </div>

            <nav v-if="(isOwner || isAdmin) && member.userId !== user?.id && member.role !== 'OWNER'" class="navigation-group justify-end md:w-1/3" aria-label="Project Member Actions">
              <select v-model="member.role">
                <option v-for="role in ROLES.filter(r => r.value !== 'OWNER')" :key="role.value" :value="role.value">
                  {{ capitalizeFirst(role.label) }}
                </option>
              </select>

              <button class="btn" aria-label="Update Member Role" @click="handleUpdateMemberRole(member.userId, member.role)">
                <icon name="ph:floppy-disk-bold" size="15" />
              </button>
              <button v-if="isOwner && String(member.role) !== 'OWNER'" class="btn" aria-label="Remove Member" @click="handleRemoveMember(member.userId)">
                <icon name="ph:x-bold" size="15" />
              </button>
            </nav>
          </li>
        </ul>
      </section>
    </section>

    <!-- Add New Member -->
    <section v-if="isOwner || isAdmin" class="md:navigation-group flex flex-col justify-between gap-2 border-b p-4 md:px-10" aria-label="Add New Member">
      <header class="flex flex-col gap-1">
        <h5>
          Add New Member
        </h5>
        <p class="text-caption">
          Invite users to join this project.
        </p>
      </header>

      <div class="md:navigation-group flex flex-col gap-1">
        <div class="flex flex-row items-center gap-2">
          <input v-model="newMemberId" type="text" placeholder="User ID" class="w-48">
          <select v-model="newMemberRole" class="md:min-w-[120px]">
            <option v-for="role in [...ROLES].reverse().filter(r => r.value !== 'OWNER')" :key="role.value" :value="role.value">
              {{ capitalizeFirst(role.label) }}
            </option>
          </select>
        </div>

        <div class="navigation-group self-end">
          <p v-if="errors.addProjectMember" class="text-danger">
            {{ errors.addProjectMember }}
          </p>
          <p v-if="addMemberSuccess" class="text-success">
            {{ addMemberSuccess }}
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

      <nav v-if="!isOwner" class="md:navigation-group flex flex-col justify-between gap-2 border-b p-4 md:px-10" aria-label="Leave Project">
        <header class="flex flex-col gap-1">
          <h5>
            Leave Project
          </h5>
          <p class="text-danger">
            This action is irreversible. You will no longer have access to this project.
          </p>
        </header>

        <div class="navigation-group self-end">
          <p v-if="errors.removeProjectMember" class="text-danger">
            {{ errors.removeProjectMember }}
          </p>

          <button class="btn-danger" aria-label="Leave Project" @click="handleLeaveProject">
            <icon name="ph:sign-out-bold" size="20" />
            <span>Confirm</span>
          </button>
        </div>
      </nav>

      <nav v-if="isOwner" class="md:navigation-group flex flex-col justify-between gap-2 border-b p-4 md:px-10" aria-label="Delete Project">
        <header class="flex flex-col gap-1">
          <h5>
            Delete Project
          </h5>
          <p class="text-danger">
            This action is irreversible. All data associated with this project will be permanently deleted.
          </p>
        </header>

        <div class="navigation-group self-end">
          <p v-if="errors.deleteProject" class="text-danger">
            {{ errors.deleteProject }}
          </p>

          <button class="btn-danger" aria-label="Delete Project" @click="handleDeleteProject">
            <icon name="ph:trash-bold" size="20" />
            <span>Confirm</span>
          </button>
        </div>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.project
const { createActionHandler } = useActionIcon()
const { user, activeOrg } = useUserActions()
const { allProjects, updateProject, deleteProject, addMember, updateMemberRole, removeMember, fetchProjects, isOwner, isAdmin, errors, setCurrentProject } = useProjectActions()

const addMemberSuccess = ref<string | null>(null)
const newMemberId = ref("")
const newMemberRole = ref(ROLES[0]?.value ?? "MEMBER")

const localProjectName = ref("")
const localProjectSlug = ref("")
const localProjectDescription = ref("")

const project = computed(() => allProjects.value.find(p => p.slug === slug))

const projectFields = [
  {
    label: "Project Name",
    description: "The name of your project.",
    type: "input",
    model: computed(() => localProjectName.value),
    update: (value: string) => {
      localProjectName.value = value
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
    model: computed(() => localProjectSlug.value),
    update: (value: string) => {
      localProjectSlug.value = value
    },
    onSave: handleSubmit,
    editable: isOwner,
  },
  {
    label: "Project Description",
    description: "Briefly describe the purpose or content of this project.",
    type: "input",
    model: computed(() => localProjectDescription.value),
    update: (value: string) => {
      localProjectDescription.value = value
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

async function handleAddMember() {
  addMemberSuccess.value = null
  if (!project.value?.id || !newMemberId.value.trim())
    return

  const success = await addMember(project.value.id, {
    userId: newMemberId.value.trim(),
    role: newMemberRole.value as Role,
  })

  if (success) {
    await fetchProjects()
    addMemberSuccess.value = "Member added successfully."
    newMemberId.value = ""
    newMemberRole.value = ROLES[0]?.value ?? "MEMBER"
  }
}

async function handleUpdateMemberRole(memberId: string, newRole: Role) {
  if (!project.value?.id)
    return

  const success = await updateMemberRole(project.value.id, memberId, { role: newRole })
  if (success)
    await fetchProjects()
}

async function handleRemoveMember(memberId: string) {
  if (!project.value?.id)
    return
  if (!confirm("Are you sure you want to remove this member?"))
    return

  await removeMember(project.value.id, memberId)
  await fetchProjects()
}

async function handleSubmit(index: number) {
  if (!project.value?.id)
    return

  const oldSlug = project.value.slug
  const newSlug = localProjectSlug.value

  const success = await updateProject(project.value.id, {
    name: localProjectName.value,
    slug: localProjectSlug.value,
    description: localProjectDescription.value,
  })

  if (success) {
    await fetchProjects()
    saveIcon[index]?.triggerSuccess()

    // If slug was changed, navigate to the new URL
    if (oldSlug !== newSlug) {
      await navigateTo(`/admin/${newSlug}/settings`)
    }
  }
}

async function handleDeleteProject() {
  if (!project.value?.id)
    return
  if (!confirm("Are you sure you want to delete this project? This action cannot be undone."))
    return

  await deleteProject(project.value.id)
}

async function handleLeaveProject() {
  if (!project.value?.id || !user.value?.id)
    return
  if (!confirm("Are you sure you want to leave this project? This action cannot be undone."))
    return

  await removeMember(project.value.id, user.value.id)
  await navigateTo("/admin/projects")
}

// Redirect if user is not a member of the project
watch([project, allProjects], ([proj, projects]) => {
  if (projects.length > 0 && !proj) {
    navigateTo("/admin/projects", { replace: true })
  }
}, { immediate: true })

// Initialize local state when project loads
watch(() => project.value, (proj) => {
  if (proj) {
    localProjectName.value = proj.name
    localProjectSlug.value = proj.slug
    localProjectDescription.value = proj.description || ""
  }
}, { immediate: true })

watch(() => project.value?.id, (id) => {
  if (id) {
    setCurrentProject(id)
  }
}, { immediate: true })

watch([project, activeOrg], ([proj, org]) => {
  if (proj && org && proj.organizationId && proj.organizationId !== org.id) {
    navigateTo("/admin/projects")
  }
}, { immediate: false })

watch(() => project.value?.id, async (id: string | undefined) => {
  const projectTitle = allProjects.value?.find(p => p.id === id)?.name

  useHead({
    title: `${projectTitle} settings`,
    link: [{ rel: "canonical", href: `https://secretkeepr.vercel.app/${id}/settings` }],
    meta: [{ name: "description", content: `${projectTitle} project settings page.` }],
  })
}, { immediate: true })

definePageMeta({
  layout: "admin",
  middleware: auth,
})
</script>
