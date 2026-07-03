<template>
  <TabSection context="Organization" title="Members">
    <div class="p-2">
      <ul class="scroll-area card flex max-h-96 flex-col items-start divide-y overflow-y-auto">
        <li v-for="orgUser in orgMembers" :key="orgUser.user.id" class="navigation-group w-full justify-between py-4 first:pt-0 last:pb-0">
          <div class="navigation-group items-start!">
            <img :src="orgUser.user.image" alt="Avatar" class="hidden size-8 rounded-full border md:block">

            <div class="flex flex-col truncate">
              <span class="font-semibold">{{ orgUser.user.name }}</span>
              <span class="text-caption">Role: {{ ROLES.find(role => role.value === orgUser.role)?.label }}</span>
            </div>
          </div>

          <nav v-if="isOwner && orgUser.user.id !== user?.id" class="navigation-group" aria-label="Organization Member Actions">
            <select v-model="orgUser.role">
              <option v-for="role in ROLES.filter(r => r.value !== 'OWNER')" :key="role.value" :value="role.value">
                {{ role.label }}
              </option>
            </select>

            <button class="btn" aria-label="Update Member Role" @click="orgUser.role !== 'OWNER' && handleUpdateMemberRole(orgUser.user.id || '', orgUser.role)">
              <icon :name="memberRoleIcon.get(orgUser.user.id)?.icon || 'ph:floppy-disk-bold'" size="15" />
            </button>
            <button class="btn" aria-label="Transfer Organization Ownership" @click="handleTransferOwnership(orgUser.user.id || '')">
              <icon :name="transferOwnershipIcon.get(orgUser.user.id)?.icon || 'ph:arrow-u-up-right-bold'" size="15" />
            </button>
            <button v-if="isOwner && orgUser.role !== 'OWNER'" class="btn" aria-label="Remove Member" @click="handleRemoveMember(orgUser.user.id || '')">
              <icon name="ph:x-bold" size="15" />
            </button>
          </nav>
        </li>
      </ul>
    </div>

    <div v-if="isOwner || isAdmin" class="flex flex-col justify-between gap-4 border-t py-4 md:navigation-group" aria-label="Invite Members">
      <header class="flex flex-col gap-1">
        <h6>
          Invite Members
        </h6>
        <p class="text-caption">
          Create an invite link to add new members to your organization.
        </p>
      </header>

      <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
        <input v-model="inviteEmail" type="email" placeholder="colleague@example.com" class="w-full md:max-w-64">

        <select v-model="inviteRole" class="md:max-w-32">
          <option v-for="role in ROLES.filter(r => r.value !== 'OWNER')" :key="role.value" :value="role.value">
            {{ role.label }}
          </option>
        </select>

        <button class="btn-primary" :disabled="!inviteEmail.trim()" @click="handleCreateInvite">
          <icon :name="inviteLinkIcon.icon.value" size="20" />
          <span>Copy Invite Link</span>
        </button>
      </div>
    </div>
  </TabSection>
</template>

<script setup lang="ts">
const { createActionHandler } = useActionIcon()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const orgStore = useOrgStore()
const { activeOrg, orgMembers, isOwner, isAdmin } = storeToRefs(orgStore)
const inviteEmail = ref("")
const inviteRole = ref<"ADMIN" | "MEMBER">("MEMBER")
const memberRoleIcon = ref(new Map())
const transferOwnershipIcon = ref(new Map())
const inviteLinkIcon = createActionHandler("ph:link-bold")

async function handleCreateInvite() {
  if (!activeOrg.value?.id || !inviteEmail.value.trim()) {
    return
  }

  const result = await orgStore.createInvite(activeOrg.value.id, { orgId: activeOrg.value.id, email: inviteEmail.value.trim(), role: inviteRole.value })
  if (result?.inviteUrl) {
    await inviteLinkIcon.triggerCopy(result.inviteUrl)
    inviteEmail.value = ""
  }
}

async function handleUpdateMemberRole(memberId: string, newRole: "ADMIN" | "MEMBER") {
  if (!activeOrg.value?.id) {
    return
  }

  await orgStore.updateOrgMember(activeOrg.value.id, memberId, { role: newRole })
  await userStore.getUser()
  memberRoleIcon.value.get(memberId)?.triggerSuccess()
}

async function handleRemoveMember(memberId: string) {
  if (!activeOrg.value?.id) {
    return
  }
  if (!confirm("Are you sure you want to remove this member?")) {
    return
  }

  await orgStore.removeOrgMember(activeOrg.value.id, memberId)
  await userStore.getUser()
  await orgStore.getOrg(activeOrg.value.id)
}

async function handleTransferOwnership(newOwnerId: string) {
  if (!activeOrg.value?.id) {
    return
  }
  if (!confirm("Are you sure you want to transfer ownership to this member? You will be demoted to admin.")) {
    return
  }

  await orgStore.transferOrgOwnership(activeOrg.value.id, { newOwnerId })
  await userStore.getUser()
  await orgStore.getOrg(activeOrg.value.id)
  transferOwnershipIcon.value.get(newOwnerId)?.triggerSuccess()
}

// Initialize action handlers for members
watch(orgMembers, (members) => {
  members.forEach((member) => {
    if (!memberRoleIcon.value.has(member.user.id)) {
      memberRoleIcon.value.set(member.user.id, createActionHandler("ph:floppy-disk-bold"))
    }
    if (!transferOwnershipIcon.value.has(member.user.id)) {
      transferOwnershipIcon.value.set(member.user.id, createActionHandler("ph:arrow-u-up-right-bold"))
    }
  })
}, { immediate: true, deep: true })
</script>
