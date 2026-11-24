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
        <select id="member-role" v-model="selectedRole" class="w-full" :disabled="isRemoving">
          <option v-for="r in ROLES.filter(r => r.value !== 'OWNER')" :key="r.value" :value="r.value">
            {{ r.label }}
          </option>
        </select>
      </div>

      <p v-if="isRemoving" class="text-caption-danger">
        Remove this member from the organization?
      </p>

      <footer class="flex flex-row items-center justify-end">
        <nav class="navigation-group">
          <button type="button" class="btn-ghost" @click="handleFooterCancel">
            {{ isRemoving ? "Cancel" : "Close" }}
          </button>
          <button v-if="isRemoving" type="button" class="btn-danger" @click="confirmRemove">
            <icon name="ph:user-minus-bold" size="20" />
            <span>Remove</span>
          </button>
          <template v-else>
            <button v-if="member.role !== 'OWNER' && selectedRole !== member.role" type="button" class="btn-success" @click="handleUpdateRole">
              <icon :name="saveIcon.icon.value" size="20" />
              <span>Save Role</span>
            </button>
            <button v-if="isOwner && member.role !== 'OWNER'" type="button" class="btn-danger" @click="isRemoving = true">
              <icon name="ph:user-minus-bold" size="20" />
              <span>Remove Member</span>
            </button>
          </template>
        </nav>
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
const saveIcon = useActionIcon("ph:floppy-disk-bold")
const selectedRole = ref<"ADMIN" | "MEMBER">("MEMBER")
const isRemoving = ref(false)

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

async function confirmRemove() {
  if (!props.orgId || !props.member?.user.id) {
    isRemoving.value = false
    return
  }

  await orgStore.removeOrgMember(props.orgId, props.member.user.id)
  await userStore.getUser()
  await orgStore.getOrg(props.orgId)
  isRemoving.value = false
  emit("updated")
  emit("update:isOpen", false)
}

function handleFooterCancel() {
  if (isRemoving.value) {
    isRemoving.value = false
    return
  }
  emit("update:isOpen", false)
}

// Sync selected role when the member changes
watch(() => props.member, (member) => {
  isRemoving.value = false
  if (member && member.role !== "OWNER") {
    selectedRole.value = member.role as "ADMIN" | "MEMBER"
  }
}, { immediate: true })

// Reset the form when the dialog is closed
watch(() => props.isOpen, (open) => {
  if (!open) {
    isRemoving.value = false
  }
})
</script>
