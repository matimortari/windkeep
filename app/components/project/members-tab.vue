<template>
  <TabSection title="Members" description="Manage who has access to this project.">
    <div class="p-2">
      <ul class="scroll-area card flex max-h-96 flex-col items-start overflow-y-auto">
        <li v-for="member in project?.memberships" :key="member.userId" class="navigation-group w-full justify-between border-y py-4 first:border-t-0 first:pt-0 last:pb-0">
          <div class="navigation-group items-start!">
            <img :src="member.user.image" alt="Avatar" class="hidden size-8 rounded-full border md:block">
            <div class="flex flex-col truncate">
              <span class="font-semibold">{{ member.user?.name }}</span>
              <span class="text-caption">Role: {{ ROLES.find(role => role.value === member.role)?.label }}</span>
            </div>
          </div>

          <nav v-if="(isOwner(project?.id ?? '') || isAdmin(project?.id ?? '')) && member.userId !== user?.id && member.role !== 'OWNER'" class="navigation-group" aria-label="Project Member Actions">
            <select v-model="member.role">
              <option v-for="role in ROLES.filter(r => r.value !== 'OWNER')" :key="role.value" :value="role.value">
                {{ role.label }}
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
    </div>

    <div v-if="isOwner(project?.id ?? '') || isAdmin(project?.id ?? '')" class="flex flex-col justify-between gap-4 border-b py-4 md:navigation-group" aria-label="Add New Member">
      <header class="flex flex-col gap-1">
        <h6>
          Add New Member
        </h6>
        <p class="text-caption">
          Invite users to join this project.
        </p>
      </header>

      <div class="flex flex-col gap-1 md:navigation-group">
        <div v-if="availableOrgMembers.length" ref="addMemberDropdownRef" class="relative navigation-group">
          <button class="btn w-full justify-between md:w-auto" @click="isAddMemberDropdownOpen = !isAddMemberDropdownOpen">
            <span class="truncate">{{ newMemberToAdd ? availableOrgMembers.find(m => m.user.id === newMemberToAdd)?.user.name : 'Select a member...' }}</span>
            <icon name="ph:caret-down-bold" size="20" :class="[isAddMemberDropdownOpen ? 'rotate-180' : 'rotate-0']" />
          </button>

          <transition name="dropdown">
            <ul v-if="isAddMemberDropdownOpen" class="dropdown-menu max-h-60 w-full md:w-80" role="menu">
              <li v-for="member in availableOrgMembers" :key="member.user.id" class="truncate whitespace-nowrap">
                <button class="navigation-group w-full truncate rounded-lg p-2 text-left hover:bg-muted/60" :class="newMemberToAdd === member.user.id ? 'bg-muted' : ''" @click="newMemberToAdd = member.user.id; isAddMemberDropdownOpen = false">
                  <img :src="member.user.image" alt="Avatar" class="size-6 rounded-full border">
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
              {{ role.label }}
            </option>
          </select>
        </div>

        <p v-else class="text-muted-foreground">
          No available members to add.
        </p>

        <div v-if="availableOrgMembers.length" class="navigation-group self-end">
          <button class="btn-primary" aria-label="Add Member" @click.prevent="handleAddMember">
            <icon name="ph:plus-circle-bold" size="20" />
            <span>Add Member</span>
          </button>
        </div>
      </div>
    </div>
  </TabSection>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.project
const { createActionHandler } = useActionIcon()
const { user } = storeToRefs(useUserStore())
const { orgMembers } = storeToRefs(useOrgStore())
const projectStore = useProjectStore()
const { projects, isOwner, isAdmin } = storeToRefs(projectStore)
const project = computed(() => projects.value.find(p => p.slug === slug))
const newMemberToAdd = ref<string>("")
const newMemberRole = ref(ROLES[0]?.value ?? "MEMBER")
const isAddMemberDropdownOpen = ref(false)
const addMemberDropdownRef = ref<HTMLElement | null>(null)
const memberRoleIcon = ref(new Map())

const availableOrgMembers = computed(() => {
  if (!project.value || !orgMembers.value) {
    return []
  }
  return orgMembers.value.filter(member => !new Set(project.value?.memberships?.map(m => m.userId) || []).has(member.user.id))
})

useClickOutside(addMemberDropdownRef, () => {
  isAddMemberDropdownOpen.value = false
}, { escapeKey: true })

async function handleAddMember() {
  if (!project.value?.id || !newMemberToAdd.value) {
    return
  }
  await projectStore.addProjectMember(project.value.id, { userId: newMemberToAdd.value, role: newMemberRole.value as "ADMIN" | "MEMBER" })
  await projectStore.getProjects()
  newMemberToAdd.value = ""
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
</script>
