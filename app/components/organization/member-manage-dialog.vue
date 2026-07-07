<template>
  <Dialog :is-open="isOpen" title="Manage Member" @update:is-open="emit('update:isOpen', $event)">
    <div v-if="member" class="flex flex-col gap-4">
      <div class="navigation-group items-start! rounded-sm border bg-muted/30 p-4">
        <img :src="member.user.image" alt="Avatar" class="size-10 rounded-full border">
        <div class="flex flex-col">
          <span class="font-semibold">{{ member.user.name }}</span>
          <span class="text-caption">{{ member.user.email }}</span>
        </div>
      </div>

      <div v-if="member.role !== 'OWNER'" class="flex flex-col items-start gap-1">
        <label for="member-role" class="text-sm font-semibold">Role</label>
        <select id="member-role" v-model="selectedRole" class="w-full">
          <option v-for="r in ROLES.filter(r => r.value !== 'OWNER')" :key="r.value" :value="r.value">
            {{ r.label }}
          </option>
        </select>
      </div>

      <footer class="flex flex-col gap-2 border-t pt-4">
        <button v-if="member.role !== 'OWNER' && selectedRole !== member.role" class="btn-success w-full" @click="handleUpdateRole">
          <icon :name="saveIcon.icon.value" size="20" />
          <span>Save Role</span>
        </button>

        <button v-if="isOwner && member.user.id !== currentUserId && member.role !== 'OWNER'" class="btn w-full" @click="handleTransferOwnership">
          <icon :name="transferIcon.icon.value" size="20" />
          <span>Transfer Ownership</span>
        </button>

        <button v-if="isOwner && member.role !== 'OWNER'" class="btn w-full text-danger" @click="handleRemove">
          <icon name="ph:user-minus-bold" size="20" />
          <span>Remove Member</span>
        </button>

        <button class="btn-ghost w-full" @click="emit('update:isOpen', false)">
          Close
        </button>
      </footer>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  orgId: string
  member: OrgMembership | null
  isOwner: boolean
  currentUserId?: string
}>()

const emit = defineEmits<{
  "update:isOpen": [value: boolean]
  "updated": []
}>()

const orgStore = useOrgStore()
const userStore = useUserStore()
const { createActionHandler } = useActionIcon()
const saveIcon = createActionHandler("ph:floppy-disk-bold")
const transferIcon = createActionHandler("ph:arrow-u-up-right-bold")
const selectedRole = ref<"ADMIN" | "MEMBER">("MEMBER")

async function handleUpdateRole() {
  if (!props.orgId || !props.member?.user.id || props.member.role === "OWNER") {
    return
  }

  await orgStore.updateOrgMember(props.orgId, props.member.user.id, { role: selectedRole.value })
  await userStore.getUser()
  await orgStore.getOrg(props.orgId)
  saveIcon.triggerSuccess()
  emit("updated")
  emit("update:isOpen", false)
}

async function handleTransferOwnership() {
  if (!props.orgId || !props.member?.user.id) {
    return
  }
  if (!confirm("Are you sure you want to transfer ownership to this member? You will be demoted to admin.")) {
    return
  }

  await orgStore.transferOrgOwnership(props.orgId, { newOwnerId: props.member.user.id })
  await userStore.getUser()
  await orgStore.getOrg(props.orgId)
  transferIcon.triggerSuccess()
  emit("updated")
  emit("update:isOpen", false)
}

async function handleRemove() {
  if (!props.orgId || !props.member?.user.id) {
    return
  }
  if (!confirm("Are you sure you want to remove this member?")) {
    return
  }

  await orgStore.removeOrgMember(props.orgId, props.member.user.id)
  await userStore.getUser()
  await orgStore.getOrg(props.orgId)
  emit("updated")
  emit("update:isOpen", false)
}

watch(() => props.member, (member) => {
  if (member && member.role !== "OWNER") {
    selectedRole.value = member.role as "ADMIN" | "MEMBER"
  }
}, { immediate: true })
</script>
