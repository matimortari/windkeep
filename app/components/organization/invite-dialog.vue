<template>
  <Dialog :is-open="isOpen" title="Invite Member" @update:is-open="emit('update:isOpen', $event)">
    <form class="flex w-full min-w-0 flex-col gap-4 md:w-md" @submit.prevent="handleSubmit">
      <div class="flex flex-col items-start gap-1">
        <label for="invite-email" class="text-sm font-semibold">Email</label>
        <input id="invite-email" v-model="email" type="email" placeholder="colleague@example.com">
        <span class="text-xs text-muted-foreground">The email address to send the invitation to.</span>
      </div>

      <div class="flex flex-col items-start gap-1">
        <label for="invite-role" class="text-sm font-semibold">Role</label>
        <select id="invite-role" v-model="role" class="w-full">
          <option v-for="r in ROLES.filter(r => r.value !== 'OWNER')" :key="r.value" :value="r.value">
            {{ r.label }}
          </option>
        </select>
        <span class="text-xs text-muted-foreground">The role the invitee will receive upon joining.</span>
      </div>

      <template v-if="generatedInviteUrl">
        <div class="flex flex-col gap-1.5">
          <p class="text-xs text-muted-foreground">
            Invitation created – share this link with the invitee. It will expire in 12 hours.
          </p>
          <div class="navigation-group rounded-md border bg-muted/30 px-2 py-1.5 font-mono text-xs">
            <span class="min-w-0 flex-1 truncate select-all" :title="generatedInviteUrl">{{ generatedInviteUrl }}</span>
            <button type="button" class="btn-ghost shrink-0 p-0! text-muted-foreground" aria-label="Copy invite link" @click="copyInviteLink">
              <icon :name="inviteLinkIcon.icon.value" size="15" />
            </button>
          </div>
        </div>
      </template>

      <footer class="flex flex-row items-center justify-end">
        <nav class="navigation-group">
          <button type="button" class="btn-ghost" @click="emit('update:isOpen', false)">
            {{ generatedInviteUrl ? "Close" : "Cancel" }}
          </button>
          <button v-if="!generatedInviteUrl" type="submit" class="btn-success" :disabled="!email.trim()">
            <icon name="ph:link-bold" size="20" />
            <span>Create & Copy Link</span>
          </button>
        </nav>
      </footer>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  orgId: string
  initialEmail?: string
}>()

const emit = defineEmits<{
  "update:isOpen": [value: boolean]
  "created": []
}>()

const orgStore = useOrgStore()
const inviteLinkIcon = useActionIcon("ph:copy-bold")
const email = ref("")
const role = ref<"ADMIN" | "MEMBER">("MEMBER")
const generatedInviteUrl = ref("")

function resetForm() {
  email.value = props.initialEmail ?? ""
  role.value = "MEMBER"
  generatedInviteUrl.value = ""
}

async function handleSubmit() {
  if (!props.orgId || !email.value.trim()) {
    return
  }

  const result = await orgStore.createInvite(props.orgId, { orgId: props.orgId, email: email.value.trim(), role: role.value })
  if (result?.inviteUrl) {
    generatedInviteUrl.value = result.inviteUrl
    await inviteLinkIcon.triggerCopy(result.inviteUrl)
    emit("created")
  }
}

async function copyInviteLink() {
  await inviteLinkIcon.triggerCopy(generatedInviteUrl.value)
}

// Reset form when dialog is opened
watch(() => props.isOpen, (open) => {
  if (open) {
    resetForm()
  }
}, { immediate: true })
</script>
