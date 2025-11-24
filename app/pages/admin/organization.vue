<template>
  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1 }" :duration="800">
    <h2 class="border-b py-4">
      Organization
    </h2>

    <section class="flex flex-col">
      <div class="gap-2 border-b p-4 md:navigation-group">
        <header class="flex flex-col gap-2">
          <h3>
            Organization Details
          </h3>
          <p class="text-caption">
            Manage organization details and settings.
          </p>
        </header>

        <p v-if="Object.values(errors).some(Boolean)" class="text-danger">
          {{ Object.values(errors).find(Boolean) }}
        </p>
      </div>

      <!-- Organization Details -->
      <div v-for="(field, index) in orgFields" :key="index" class="flex flex-col justify-between gap-2 border-b p-4 md:navigation-group md:px-10">
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
            <icon :name="copyIcon[index]?.icon.value || 'ph:copy'" size="20" />
          </button>
        </div>

        <div v-else-if="field.type === 'input' && field.editable" class="navigation-group justify-end">
          <input type="text" :value="field.model?.value" @input="field.update?.(($event.target as HTMLInputElement).value)">
          <button class="btn transition-transform" aria-label="Save Changes" @click="field.onSave(index)">
            <icon :name="saveIcon[index]?.icon.value || 'ph:floppy-disk'" size="20" />
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
                <icon name="ph:eye" size="15" />
              </nuxt-link>
              <nuxt-link v-if="isOwner || isAdmin" :to="`/admin/${project?.slug}/settings`" class="btn">
                <icon name="ph:gear" size="15" />
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
          <li v-for="orgUser in orgMembers" :key="orgUser.user.id" class="card navigation-group w-full justify-between overflow-hidden">
            <div class="flex min-w-0 flex-row items-center gap-4">
              <img :src="orgUser.user.image ?? undefined" alt="Avatar" class="hidden size-12 rounded-full border-2 md:block">

              <div class="flex min-w-0 flex-col">
                <span class="truncate">{{ orgUser.user.name }}</span>
                <span class="text-caption truncate">Role: {{ capitalizeFirst(orgUser.role) }}</span>
                <span class="text-caption truncate">{{ orgUser.user.id }}</span>
              </div>
            </div>

            <nav v-if="isOwner && orgUser.user.id !== user?.id" class="navigation-group justify-end" aria-label="Organization Member Actions">
              <select v-model="userRoles[orgUser.user.id as string]">
                <option v-for="role in ROLES.filter(r => r.value !== 'OWNER')" :key="role.value" :value="role.value" class="capitalize">
                  {{ capitalizeFirst(role.label) }}
                </option>
              </select>

              <button class="btn" aria-label="Update Member Role" @click="handleUpdateMemberRole(orgUser.user.id || '', userRoles[String(orgUser.user.id)] || 'MEMBER')">
                <icon name="ph:floppy-disk" size="15" />
              </button>
              <button v-if="isOwner && orgUser.role !== 'OWNER'" class="btn" aria-label="Remove Member" @click="handleRemoveMember(orgUser.user.id || '')">
                <icon name="ph:x" size="15" />
              </button>
            </nav>
          </li>
        </ul>
      </section>
    </section>

    <!-- Invite Members -->
    <section v-if="isOwner || isAdmin" class="flex flex-col justify-between gap-2 border-b p-4 md:navigation-group md:px-10" aria-label="Invite Members">
      <header class="flex flex-col gap-1">
        <h5>
          Invite Members
        </h5>
        <p class="text-caption">
          Generate an invitation link to invite new users to this organization.
        </p>
      </header>

      <div class="navigation-group self-end">
        <p v-if="errors.createInvite" class="text-danger">
          {{ errors.createInvite }}
        </p>
        <p v-if="inviteSuccess" class="text-success">
          {{ inviteSuccess }}
        </p>

        <button class="btn-primary" aria-label="Create Invite Link" @click="handleCreateInvite">
          <icon name="ph:link" size="20" />
          <span>Copy Invite Link</span>
        </button>
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

      <nav class="flex flex-col justify-between gap-2 border-b p-4 md:navigation-group md:px-10" aria-label="Leave Organization">
        <header class="flex flex-col gap-1">
          <h5>
            Leave Organization
          </h5>
          <p class="text-danger">
            This action is irreversible. You will no longer have access to this organization.
          </p>
        </header>

        <div class="navigation-group self-end">
          <p v-if="errors.removeOrgMember" class="text-danger">
            {{ errors.removeOrgMember }}
          </p>

          <button class="btn-danger" aria-label="Leave Organization" @click="handleLeaveOrg">
            <icon name="ph:sign-out" size="20" />
            <span>Confirm</span>
          </button>
        </div>
      </nav>

      <nav v-if="isOwner" class="flex flex-col justify-between gap-2 border-b p-4 md:navigation-group md:px-10" aria-label="Delete Organization">
        <header class="flex flex-col gap-1">
          <h5>
            Delete Organization
          </h5>
          <p class="text-danger">
            This action is irreversible. All data associated with this organization will be permanently deleted.
          </p>
        </header>

        <div class="navigation-group self-end">
          <p v-if="errors.deleteOrg" class="text-danger">
            {{ errors.deleteOrg }}
          </p>

          <button class="btn-danger" aria-label="Delete Organization" @click="handleDeleteOrg">
            <icon name="ph:network-x" size="20" />
            <span>Confirm</span>
          </button>
        </div>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
const { createActionHandler } = useActionIcon()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const orgStore = useOrgStore()
const { activeOrg, orgMembers, orgProjects, isOwner, isAdmin, errors } = storeToRefs(orgStore)
const userRoles = ref<Record<string, Role>>({})
const inviteSuccess = ref<string | null>(null)

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
    value: computed(() => formatDate(activeOrg.value?.createdAt)),
  },
  {
    label: "Updated At",
    description: "When your organization was last updated.",
    value: computed(() => formatDate(activeOrg.value?.updatedAt)),
  },
]

const copyIcon = orgFields.map(() => createActionHandler("ph:copy"))
const saveIcon = orgFields.map(() => createActionHandler("ph:floppy-disk"))

async function handleCreateInvite() {
  inviteSuccess.value = null
  if (!activeOrg.value?.id)
    return

  const result = await orgStore.createInvite(activeOrg.value.id, {
    orgId: activeOrg.value.id,
  })

  if (result?.inviteUrl) {
    await navigator.clipboard.writeText(result.inviteUrl)
    inviteSuccess.value = "Invite link copied to clipboard!"
  }
}

async function handleUpdateMemberRole(memberId: string, newRole: Role) {
  if (!activeOrg.value?.id)
    return

  const success = await orgStore.updateOrgMember(activeOrg.value.id, memberId, { role: newRole })
  if (success)
    await userStore.getUser()
}

async function handleRemoveMember(memberId: string) {
  if (!activeOrg.value?.id)
    return
  if (!confirm("Are you sure you want to remove this member?"))
    return

  await orgStore.removeOrgMember(activeOrg.value.id, memberId)
  await userStore.getUser()
}

async function handleSubmit(index: number) {
  if (!activeOrg.value?.id)
    return

  const success = await orgStore.updateOrg(activeOrg.value.id, {
    name: activeOrg.value.name || "",
  })

  if (success) {
    await userStore.getUser()
    saveIcon[index]?.triggerSuccess()
  }
}

async function handleLeaveOrg() {
  if (!activeOrg.value?.id || !user.value?.id)
    return
  if (!confirm("Are you sure you want to leave this organization? This action cannot be undone."))
    return

  await orgStore.removeOrgMember(activeOrg.value.id, user.value.id)
  await navigateTo("/onboarding/create-org")
}

async function handleDeleteOrg() {
  if (!activeOrg.value?.id)
    return
  if (!confirm("Are you sure you want to delete this organization? This action cannot be undone."))
    return

  await orgStore.deleteOrg(activeOrg.value.id)
}

watch(() => orgMembers.value, (memberships: OrgMembership[] = []) => {
  userRoles.value = Object.fromEntries(memberships.map(m => [m.userId, m.role]))
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
