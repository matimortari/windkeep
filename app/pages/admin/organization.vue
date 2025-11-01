<template>
  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1 }" :duration="800">
    <h2 class="border-b py-2">
      Organization
    </h2>

    <section class="flex flex-col">
      <div class="md:navigation-group gap-2 border-b p-4">
        <header class="flex flex-col gap-2">
          <h3>
            Organization Details
          </h3>
          <p class="text-caption">
            Manage organization details and settings.
          </p>
        </header>

        <p v-if="Object.values(orgErrors).some(Boolean)" class="text-warning">
          {{ Object.values(orgErrors).find(Boolean) }}
        </p>
      </div>

      <!-- Organization Details -->
      <div v-for="(field, index) in orgFields" :key="index" class="md:navigation-group flex flex-col justify-between gap-2 border-b p-4 md:px-10">
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
            class="btn" title="Copy to Clipboard"
            aria-label="Copy to Clipboard" @click="copyIcon[index]?.triggerCopy(field.value?.value || '')"
          >
            <icon :name="copyIcon[index]?.icon.value || 'ph:copy-bold'" size="20" />
          </button>
        </div>

        <div v-else-if="field.type === 'input'" class="navigation-group justify-end">
          <input class="w-full" type="text" :value="field.model?.value" @input="field.update?.(($event.target as HTMLInputElement).value)">
          <button class="btn" aria-label="Save Changes" @click="field.onSave(index)">
            <icon :name="saveIcon[index]?.icon.value || 'ph:floppy-disk-bold'" size="20" />
          </button>
        </div>

        <span v-else class="navigation-group justify-end">{{ field.value }}</span>
      </div>

      <!-- Organization Projects List -->
      <section v-if="isOwner || isAdmin" class="flex flex-col justify-between border-b p-4 md:px-10">
        <h5>
          Organization Projects
        </h5>

        <ul class="scroll-area flex max-h-52 flex-col items-start gap-1 overflow-y-auto">
          <li
            v-for="project
              in orgProjects" :key="project.id"
            class="card navigation-group w-full justify-between"
          >
            <div class="flex flex-col gap-1 truncate">
              <span>{{ project?.name }}</span>
              <span class="text-caption">{{ project?.description || "No description provided." }}</span>
            </div>

            <nav class="navigation-group justify-end" aria-label="Organization Project Actions">
              <nuxt-link :to="`/admin/${project?.slug}`" class="btn">
                <icon name="ph:eye-bold" size="15" />
              </nuxt-link>
              <nuxt-link :to="`/admin/${project?.slug}/settings`" class="btn">
                <icon name="ph:gear-bold" size="15" />
              </nuxt-link>
            </nav>
          </li>
        </ul>
      </section>

      <!-- Organization Members List -->
      <section class="flex flex-col justify-between border-b p-4 md:px-10">
        <h5>
          Organization Members
        </h5>

        <ul class="scroll-area flex max-h-52 flex-col items-start gap-1 overflow-y-auto">
          <li v-for="orgUser in orgMembers" :key="orgUser.id" class="card navigation-group w-full justify-between overflow-hidden">
            <div class="flex min-w-0 flex-row items-center gap-2">
              <img :src="orgUser.image ?? undefined" alt="Avatar" class="hidden size-10 rounded-full border-2 md:block">
              <div class="flex min-w-0 flex-col">
                <span class="truncate">{{ orgUser?.name }}</span>
                <span class="text-caption truncate">Role: {{ orgUser?.role }}</span>
                <span class="text-caption truncate">{{ orgUser?.id }}</span>
              </div>
            </div>

            <nav v-if="isOwner && orgUser.id !== user?.id" class="navigation-group justify-end" aria-label="Organization Member Actions">
              <select v-model="userRoles[orgUser.id as string]">
                <option v-for="role in ROLES.filter(r => r.value !== 'owner')" :key="role.value" :value="role.value" class="capitalize">
                  {{ role.label }}
                </option>
              </select>

              <button class="btn" aria-label="Update Member Role" @click="handleUpdateMemberRole(orgUser.id || '', userRoles[String(orgUser.id)] || 'MEMBER')">
                <icon name="ph:floppy-disk-bold" size="15" />
              </button>
              <button v-if="isOwner && orgUser.role !== 'OWNER'" class="btn" aria-label="Remove Member" @click="handleRemoveMember(orgUser.id || '')">
                <icon name="ph:x-bold" size="15" />
              </button>
            </nav>
          </li>
        </ul>
      </section>
    </section>

    <!-- Invite Members -->
    <section v-if="isOwner || isAdmin" class="md:navigation-group flex flex-col justify-between gap-2 border-b p-4 md:px-10" aria-label="Invite Members">
      <header class="flex flex-col gap-1">
        <h5>
          Invite Members
        </h5>
        <p class="text-caption">
          Generate an invitation link to invite new users to this organization.
        </p>
      </header>

      <div class="navigation-group self-end">
        <p v-if="inviteError" class="text-warning">
          {{ inviteError }}
        </p>
        <p v-if="inviteSuccess" class="text-success">
          {{ inviteSuccess }}
        </p>

        <button class="btn-primary" aria-label="Create Invite Link" @click="handleCreateInvite">
          <icon name="ph:link-bold" size="20" />
          <span>Copy Invite Link</span>
        </button>
      </div>
    </section>

    <!-- Danger Zone -->
    <section class="flex flex-col">
      <header class="flex flex-col items-start gap-1 border-b p-4 text-start">
        <h3>
          Danger Zone
        </h3>
        <p class="text-caption">
          This section contains actions that can significantly affect your account. Please proceed with caution.
        </p>
      </header>

      <nav class="md:navigation-group flex flex-col justify-between gap-2 border-b p-4 md:px-10" aria-label="Leave Organization">
        <header class="flex flex-col gap-1">
          <h5>
            Leave Organization
          </h5>
          <p class="text-warning">
            This action is irreversible. You will no longer have access to this organization.
          </p>
        </header>

        <div class="navigation-group self-end">
          <p v-if="leaveOrgError" class="text-warning">
            {{ leaveOrgError }}
          </p>

          <button class="btn-danger" aria-label="Leave Organization" @click="handleLeaveOrg">
            <icon name="ph:sign-out-bold" size="20" />
            <span>Confirm</span>
          </button>
        </div>
      </nav>

      <nav v-if="isOwner" class="md:navigation-group flex flex-col justify-between gap-2 border-b p-4 md:px-10" aria-label="Delete Organization">
        <header class="flex flex-col gap-1">
          <h5>
            Delete Organization
          </h5>
          <p class="text-warning">
            This action is irreversible. All data associated with this organization will be permanently deleted.
          </p>
        </header>

        <div class="navigation-group self-end">
          <p v-if="deleteOrgError" class="text-warning">
            {{ deleteOrgError }}
          </p>

          <button class="btn-danger" aria-label="Delete Organization" @click="handleDeleteOrg">
            <icon name="ph:network-x-bold" size="20" />
            <span>Confirm</span>
          </button>
        </div>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
const { createActionHandler } = useActionIcon()
const { user, activeOrg, fetchUser } = useUserActions()
const { updateOrganization, deleteOrganization, updateMemberRole, removeMember, inviteMember, errors: orgErrors } = useOrganizationActions()
const { allProjects } = useProjectActions()

const userRoles = ref<Record<string, Role>>({})
const leaveOrgError = ref<string | null>(null)
const deleteOrgError = ref<string | null>(null)
const inviteError = ref<string | null>(null)
const inviteSuccess = ref<string | null>(null)
const orgProjects = computed(() => allProjects.value.filter(p => p.organizationId === activeOrg.value?.id))
const orgMembers = computed(() => {
  const members = (activeOrg.value as any)?.members || []
  return members.map((m: any) => ({
    id: m.user?.id,
    name: m.user?.name,
    email: m.user?.email,
    image: m.user?.image,
    role: m.role || "MEMBER",
  }))
})

const isOwner = computed(() => orgMembers.value.find((m: any) => m.id === user.value?.id)?.role === "OWNER")
const isAdmin = computed(() => orgMembers.value.find((m: any) => m.id === user.value?.id)?.role === "ADMIN")

const orgFields = [
  {
    label: "Organization Name",
    description: "The name of your organization.",
    type: "input",
    model: computed(() => activeOrg.value?.name || ""),
    update: (value: string) => {
      if (activeOrg.value)
        activeOrg.value.name = value
    },
    onSave: handleSubmit,
    editable: isOwner,
  },
  {
    label: "Organization ID",
    description: "This ID uniquely identifies your organization.",
    value: computed(() => activeOrg.value?.id),
    copyable: true,
  },
  {
    label: "Created At",
    description: "When your organization was created.",
    value: computed(() => formatDate((activeOrg.value as any)?.createdAt ? new Date((activeOrg.value as any).createdAt) : null)),
  },
  {
    label: "Updated At",
    description: "When your organization was last updated.",
    value: computed(() => formatDate((activeOrg.value as any)?.updatedAt ? new Date((activeOrg.value as any).updatedAt) : null)),
  },
]

const copyIcon = orgFields.map(() => createActionHandler("ph:copy-bold"))
const saveIcon = orgFields.map(() => createActionHandler("ph:floppy-disk-bold"))

async function handleCreateInvite() {
  orgErrors.value.createInvite = null
  inviteSuccess.value = null
  if (!activeOrg.value?.id) {
    orgErrors.value.createInvite = "Organization ID is required"
    return
  }

  try {
    const invite = await inviteMember(activeOrg.value.id, {
      email: "",
      organizationId: activeOrg.value.id,
      role: "MEMBER",
    }) as any
    const baseUrl = getBaseUrl()
    const inviteLink = `${baseUrl}/onboarding/join-org?token=${invite.invitation.token}`
    await navigator.clipboard.writeText(inviteLink)
    inviteSuccess.value = "Invite link copied to clipboard!"
  }
  catch (err: any) {
    orgErrors.value.createInvite = err.message
  }
}

async function handleUpdateMemberRole(memberId: string, newRole: Role) {
  orgErrors.value.updateOrgMember = null
  if (!activeOrg.value?.id)
    return

  try {
    await updateMemberRole(activeOrg.value.id, memberId, { role: newRole })
    await fetchUser()
  }
  catch (err: any) {
    orgErrors.value.updateOrgMember = err.message
  }
}

async function handleRemoveMember(memberId: string) {
  orgErrors.value.removeOrgMember = null
  if (!activeOrg.value?.id)
    return
  if (!confirm("Are you sure you want to remove this member?"))
    return

  try {
    await removeMember(activeOrg.value.id, memberId)
    await fetchUser()
  }
  catch (err: any) {
    orgErrors.value.removeOrgMember = err.message
  }
}

async function handleSubmit(index: number) {
  orgErrors.value.updateOrg = null
  if (!activeOrg.value?.id)
    return

  try {
    await updateOrganization(activeOrg.value.id, {
      name: activeOrg.value.name || "",
    })
    await fetchUser()
    saveIcon[index]?.triggerSuccess()
  }
  catch (err: any) {
    orgErrors.value.updateOrg = err.message
  }
}

async function handleLeaveOrg() {
  orgErrors.value.removeOrgMember = null
  if (!activeOrg.value?.id || !user.value?.id) {
    orgErrors.value.removeOrgMember = "Missing organization or user ID."
    return
  }
  if (!confirm("Are you sure you want to leave this organization? This action cannot be undone."))
    return

  try {
    await removeMember(activeOrg.value.id, user.value.id)
    await navigateTo("/onboarding/create-org")
  }
  catch (err: any) {
    orgErrors.value.removeOrgMember = err.message
  }
}

async function handleDeleteOrg() {
  orgErrors.value.deleteOrg = null
  const orgId = activeOrg.value?.id
  if (!orgId)
    return
  if (!confirm("Are you sure you want to delete this organization? This action cannot be undone."))
    return

  try {
    await deleteOrganization(orgId)
  }
  catch (err: any) {
    orgErrors.value.deleteOrg = err.message
  }
}

watch(orgMembers, (users: Array<{ id?: string, role: string }>) => {
  userRoles.value = Object.fromEntries(users.map((u: { id?: string, role: string }) => [u.id, u.role]))
}, { immediate: true })

useHead({
  title: "Organization",
  link: [{ rel: "canonical", href: "https://secretkeepr.vercel.app/admin/organization" }],
  meta: [{ name: "description", content: "SecretkeepR organization page." }],
})

definePageMeta({
  layout: "admin",
  middleware: auth,
})
</script>
