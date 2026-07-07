<template>
  <TabSection context="Organization" title="Members">
    <template v-if="canManage" #actions>
      <div class="navigation-group w-full justify-end md:w-auto">
        <button class="btn-primary" @click="isInviteDialogOpen = true">
          <icon name="ph:envelope-bold" size="20" />
          <span>Invite Member</span>
        </button>
      </div>
    </template>

    <div class="flex flex-col gap-4 py-2">
      <header class="flex flex-col gap-1">
        <h6>
          Members
        </h6>
        <p class="text-caption">
          Users with access to this organization and their roles.
        </p>
      </header>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th v-for="col in memberColumns" :key="col.key" :class="col.class">
                <div class="navigation-group">
                  <span>{{ col.label }}</span>
                  <button v-if="col.sortable" class="flex items-center hover:text-secondary" :aria-label="`Sort by ${col.label}`" @click="toggleMemberSort(col.key)">
                    <icon :name="getMemberSortIconName(col.key)" size="15" class="transition-transform" />
                  </button>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!sortedMembers.length">
              <td :colspan="memberColumns.length" class="p-8 text-center">
                <Empty message="No members found." icon-name="ph:users-three-bold" />
              </td>
            </tr>

            <tr
              v-for="orgUser in sortedMembers" :key="orgUser.user.id"
              class="hover:bg-muted/20" :class="canManageMember(orgUser) ? 'cursor-pointer' : ''"
              @click="canManageMember(orgUser) && openMemberDialog(orgUser)"
            >
              <td>
                <div class="navigation-group items-start!">
                  <img :src="orgUser.user.image" alt="Avatar" class="hidden size-8 rounded-full border md:block">
                  <div class="flex flex-col truncate">
                    <span class="font-semibold">{{ orgUser.user.name }}</span>
                    <span class="text-caption">{{ orgUser.user.email }}</span>
                  </div>
                </div>
              </td>
              <td class="w-28">
                {{ ROLES.find(role => role.value === orgUser.role)?.label }}
              </td>
              <td class="w-24">
                <button v-if="canManageMember(orgUser)" class="btn" aria-label="Manage member" @click.stop="openMemberDialog(orgUser)">
                  <icon name="ph:gear-bold" size="15" class="text-muted-foreground hover:text-secondary" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <section v-if="canManage" class="flex flex-col gap-2">
        <header class="flex flex-col gap-1">
          <h6>
            Invitations
          </h6>
          <p class="text-caption">
            Track pending, accepted, and expired invitations.
          </p>
        </header>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th v-for="col in inviteColumns" :key="col.key" :class="col.class">
                  <div class="navigation-group">
                    <span>{{ col.label }}</span>
                    <button v-if="col.sortable" class="flex items-center hover:text-secondary" :aria-label="`Sort by ${col.label}`" @click="toggleInviteSort(col.key)">
                      <icon :name="getInviteSortIconName(col.key)" size="15" class="transition-transform" />
                    </button>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="!sortedInvitations.length">
                <td :colspan="inviteColumns.length" class="p-8 text-center">
                  <Empty message="No invitations yet." icon-name="ph:envelope-open-bold" />
                </td>
              </tr>

              <tr v-for="invite in sortedInvitations" :key="invite.id" class="hover:bg-muted/20">
                <td class="max-w-xs truncate">
                  {{ invite.email }}
                </td>
                <td class="w-24">
                  {{ ROLES.find(role => role.value === invite.role)?.label }}
                </td>
                <td class="w-28">
                  <span class="rounded-sm px-1.5 py-0.5 text-xs font-semibold" :class="inviteStatusClass(getInviteStatus(invite))">
                    {{ INVITE_STATUS[getInviteStatus(invite)] }}
                  </span>
                </td>
                <td class="max-w-xs truncate">
                  {{ invite.invitedBy?.name || invite.invitedBy?.email }}
                </td>
                <td class="w-40 whitespace-nowrap">
                  {{ formatDate(invite.createdAt) }}
                </td>
                <td class="w-40 whitespace-nowrap">
                  {{ getInviteStatus(invite) === "accepted" ? formatDate(invite.acceptedAt) : formatDate(invite.expiresAt) }}
                </td>
                <td class="w-28">
                  <div class="navigation-group">
                    <button v-if="getInviteStatus(invite) === 'pending'" class="btn" aria-label="Copy invite link" @click="handleCopyInviteLink(invite)">
                      <icon :name="activeCopyInviteId === invite.id ? inviteLinkIcon.icon.value : 'ph:link-bold'" size="15" />
                    </button>
                    <button v-if="getInviteStatus(invite) === 'expired'" class="btn" aria-label="Re-invite" @click="openReinvite(invite.email)">
                      <icon name="ph:arrow-clockwise-bold" size="15" />
                    </button>
                    <button v-if="getInviteStatus(invite) !== 'accepted'" class="btn" aria-label="Revoke invitation" @click="handleRevokeInvite(invite.id)">
                      <icon name="ph:trash-bold" size="15" class="text-muted-foreground hover:text-danger" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <OrganizationInviteDialog v-model:is-open="isInviteDialogOpen" :org-id="activeOrg?.id ?? ''" :initial-email="reinviteEmail" @created="refreshInvitations" />

    <OrganizationMemberManageDialog
      v-model:is-open="isMemberDialogOpen" :org-id="activeOrg?.id ?? ''"
      :member="selectedMember" :is-owner="isOwner"
      :current-user-id="user?.id" @updated="refreshMembers"
    />
  </TabSection>
</template>

<script setup lang="ts">
const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const orgStore = useOrgStore()
const { activeOrg, orgMembers, invitations, isOwner, isAdmin } = storeToRefs(orgStore)
const { createActionHandler } = useActionIcon()
const canManage = computed(() => isOwner.value || isAdmin.value)
const isInviteDialogOpen = ref(false)
const isMemberDialogOpen = ref(false)
const selectedMember = ref<OrgMembership | null>(null)
const reinviteEmail = ref<string | undefined>()
const activeCopyInviteId = ref<string | null>(null)
const inviteLinkIcon = createActionHandler("ph:link-bold")

const memberColumns = [
  { key: "user.name", label: "Member", class: "", sortable: true },
  { key: "role", label: "Role", class: "w-28", sortable: true },
  { key: "actions", label: "Actions", class: "w-24", sortable: false },
]

const inviteColumns = [
  { key: "email", label: "Email", class: "", sortable: true },
  { key: "role", label: "Role", class: "w-24", sortable: true },
  { key: "status", label: "Status", class: "w-28", sortable: false },
  { key: "invitedBy.name", label: "Invited by", class: "", sortable: true },
  { key: "createdAt", label: "Created", class: "w-40", sortable: true },
  { key: "expiresAt", label: "Expires / Accepted", class: "w-40", sortable: true },
  { key: "actions", label: "Actions", class: "w-28", sortable: false },
]

const invitationsWithStatus = computed(() => invitations.value.map(invite => ({ ...invite, status: getInviteStatus(invite) })))
const { sortedData: sortedMembers, toggleSort: toggleMemberSort, getSortIconName: getMemberSortIconName } = useTableSort(orgMembers)
const { sortedData: sortedInvitations, toggleSort: toggleInviteSort, getSortIconName: getInviteSortIconName } = useTableSort(invitationsWithStatus)

function getInviteStatus(invitation: Pick<Invitation, "acceptedAt" | "expiresAt">): InviteStatus {
  if (invitation.acceptedAt) {
    return "accepted"
  }
  if (new Date(invitation.expiresAt) < new Date()) {
    return "expired"
  }
  return "pending"
}

function canManageMember(member: OrgMembership) {
  return isOwner.value && member.user.id !== user.value?.id && member.role !== "OWNER"
}

function openMemberDialog(member: OrgMembership) {
  selectedMember.value = member
  isMemberDialogOpen.value = true
}

function openReinvite(email: string) {
  reinviteEmail.value = email
  isInviteDialogOpen.value = true
}

function inviteStatusClass(status: InviteStatus) {
  if (status === "accepted") {
    return "bg-success/10 text-success"
  }
  if (status === "pending") {
    return "bg-secondary/10 text-secondary"
  }
  return "bg-muted/50 text-muted-foreground"
}

async function refreshMembers() {
  if (activeOrg.value?.id) {
    await orgStore.getOrg(activeOrg.value.id)
  }
}

async function refreshInvitations() {
  if (activeOrg.value?.id) {
    await orgStore.getInvitations(activeOrg.value.id)
  }
  reinviteEmail.value = undefined
}

async function handleCopyInviteLink(invite: Invitation) {
  if (!activeOrg.value?.id) {
    return
  }

  const result = await orgStore.createInvite(activeOrg.value.id, {
    orgId: activeOrg.value.id,
    email: invite.email,
    role: invite.role as "ADMIN" | "MEMBER",
  })

  if (result?.inviteUrl) {
    activeCopyInviteId.value = invite.id
    await inviteLinkIcon.triggerCopy(result.inviteUrl)
    await refreshInvitations()
  }
}

async function handleRevokeInvite(inviteId: string) {
  if (!activeOrg.value?.id) {
    return
  }
  if (!confirm("Are you sure you want to revoke this invitation?")) {
    return
  }
  await orgStore.revokeInvite(activeOrg.value.id, inviteId)
}

watch(activeOrg, async (org) => {
  if (org?.id && canManage.value) {
    await refreshInvitations()
  }
}, { immediate: true })
</script>
