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

        <p v-if="Object.values(orgErrors).some(Boolean)" class="text-danger">
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
            class="btn transition-transform" title="Copy to Clipboard"
            aria-label="Copy to Clipboard" @click="copyIcon[index]?.triggerCopy(field.value?.value || '')"
          >
            <icon :name="copyIcon[index]?.icon.value || 'ph:copy-bold'" size="20" />
          </button>
        </div>

        <div v-else-if="field.type === 'input' && field.editable" class="navigation-group justify-end">
          <input class="w-full" type="text" :value="field.model?.value" @input="field.update?.(($event.target as HTMLInputElement).value)">
          <button class="btn transition-transform" aria-label="Save Changes" @click="field.onSave(index)">
            <icon :name="saveIcon[index]?.icon.value || 'ph:floppy-disk-bold'" size="20" />
          </button>
        </div>

        <span v-else-if="field.type === 'input'" class="navigation-group justify-end">{{ field.model?.value }}</span>

        <span v-else class="navigation-group justify-end">{{ field.value }}</span>
      </div>

      <!-- Organization Projects List -->
      <section class="flex flex-col justify-between border-b p-4 md:px-10">
        <h5>
          Organization Projects
        </h5>

        <ul class="scroll-area flex max-h-52 flex-col items-start gap-1 overflow-y-auto">
          <li v-for="project in orgProjects" :key="project.id" class="card navigation-group w-full justify-between">
            <div class="flex flex-col gap-1 truncate">
              <span>{{ project?.name }}</span>
              <span class="text-caption">{{ project?.description || "No description provided." }}</span>
            </div>

            <nav class="navigation-group justify-end" aria-label="Organization Project Actions">
              <nuxt-link :to="`/admin/${project?.slug}`" class="btn">
                <icon name="ph:eye-bold" size="15" />
              </nuxt-link>
              <nuxt-link v-if="isOwner || isAdmin" :to="`/admin/${project?.slug}/settings`" class="btn">
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
                <span class="text-caption truncate">Role: {{ capitalizeFirst(orgUser?.role) }}</span>
                <span class="text-caption truncate">{{ orgUser?.id }}</span>
              </div>
            </div>

            <nav v-if="isOwner && orgUser.id !== user?.id" class="navigation-group justify-end" aria-label="Organization Member Actions">
              <select v-model="userRoles[orgUser.id as string]">
                <option v-for="role in ROLES.filter(r => r.value !== 'OWNER')" :key="role.value" :value="role.value" class="capitalize">
                  {{ capitalizeFirst(role.label) }}
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
        <p v-if="orgErrors.createInvite" class="text-danger">
          {{ orgErrors.createInvite }}
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
          <p class="text-danger">
            This action is irreversible. You will no longer have access to this organization.
          </p>
        </header>

        <div class="navigation-group self-end">
          <p v-if="orgErrors.removeOrgMember" class="text-danger">
            {{ orgErrors.removeOrgMember }}
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
          <p class="text-danger">
            This action is irreversible. All data associated with this organization will be permanently deleted.
          </p>
        </header>

        <div class="navigation-group self-end">
          <p v-if="orgErrors.deleteOrg" class="text-danger">
            {{ orgErrors.deleteOrg }}
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
const { updateOrganization, deleteOrganization, updateMemberRole, removeMember, inviteMember, isOwner, isAdmin, errors: orgErrors } = useOrganizationActions()
const { allProjects } = useProjectActions()

const userRoles = ref<Record<string, Role>>({})
const inviteSuccess = ref<string | null>(null)
const orgProjects = computed(() => allProjects.value.filter(p => p.organizationId === activeOrg.value?.id))
const orgMembers = computed(() => {
  return ((activeOrg.value)?.memberships || []).map((m: any) => ({
    id: m.user?.id,
    name: m.user?.name,
    email: m.user?.email,
    image: m.user?.image,
    role: m.role || "MEMBER",
  }))
})

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
  inviteSuccess.value = null
  if (!activeOrg.value?.id)
    return

  const result = await inviteMember(activeOrg.value.id, {
    organizationId: activeOrg.value.id,
  })

  if (result?.inviteUrl) {
    await navigator.clipboard.writeText(result.inviteUrl)
    inviteSuccess.value = "Invite link copied to clipboard!"
  }
}

async function handleUpdateMemberRole(memberId: string, newRole: Role) {
  if (!activeOrg.value?.id)
    return

  const success = await updateMemberRole(activeOrg.value.id, memberId, { role: newRole })
  if (success)
    await fetchUser()
}

async function handleRemoveMember(memberId: string) {
  if (!activeOrg.value?.id)
    return
  if (!confirm("Are you sure you want to remove this member?"))
    return

  await removeMember(activeOrg.value.id, memberId)
  await fetchUser()
}

async function handleSubmit(index: number) {
  if (!activeOrg.value?.id)
    return

  const success = await updateOrganization(activeOrg.value.id, {
    name: activeOrg.value.name || "",
  })

  if (success) {
    await fetchUser()
    saveIcon[index]?.triggerSuccess()
  }
}

async function handleLeaveOrg() {
  if (!activeOrg.value?.id || !user.value?.id)
    return
  if (!confirm("Are you sure you want to leave this organization? This action cannot be undone."))
    return

  await removeMember(activeOrg.value.id, user.value.id)
  await navigateTo("/onboarding/create-org")
}

async function handleDeleteOrg() {
  if (!activeOrg.value?.id)
    return
  if (!confirm("Are you sure you want to delete this organization? This action cannot be undone."))
    return

  await deleteOrganization(activeOrg.value.id)
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
