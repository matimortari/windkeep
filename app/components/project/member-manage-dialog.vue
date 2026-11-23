<template>
  <Dialog :is-open="isOpen" title="Manage Member" @update:is-open="emit('update:isOpen', $event)">
    <div v-if="member" class="flex flex-col gap-4">
      <div class="navigation-group items-start! rounded-sm border bg-muted/30 p-4">
        <img :src="member.user.image" alt="Avatar" class="size-10 rounded-full border">
        <div class="flex flex-col">
          <span class="font-semibold">{{ member.user?.name }}</span>
          <span class="text-caption">{{ member.user?.email }}</span>
        </div>
      </div>

      <div v-if="member.role !== 'OWNER'" class="flex flex-col items-start gap-1">
        <label for="project-role" class="text-sm font-semibold">Role</label>
        <select id="project-role" v-model="selectedRole" class="w-full">
          <option v-for="r in ROLES.filter(r => r.value !== 'OWNER')" :key="r.value" :value="r.value">
            {{ r.label }}
          </option>
        </select>
      </div>

      <div v-if="member.role !== 'OWNER' && selectedRole === 'MEMBER'" class="flex flex-col items-start gap-1">
        <span class="text-sm font-semibold">Environments</span>
        <span class="text-xs text-muted-foreground">Member can only read secrets from selected environments.</span>
        <div class="navigation-group flex-wrap">
          <button
            v-for="env in ENVIRONMENTS" :key="env.value"
            type="button" class="btn-ghost"
            :class="selectedEnvironments.includes(env.value) ? 'border-secondary! text-secondary!' : ''"
            @click="toggleEnvironment(env.value)"
          >
            {{ env.label }}
          </button>
        </div>
      </div>
      <p v-else-if="member.role !== 'OWNER'" class="text-xs text-muted-foreground">
        Admins can read secrets from all environments.
      </p>

      <footer class="flex flex-row items-center justify-end">
        <nav class="navigation-group">
          <button type="button" class="btn-ghost" @click="emit('update:isOpen', false)">
            Close
          </button>
          <button
            v-if="member.role !== 'OWNER' && hasChanges" type="button"
            class="btn-success" :disabled="!canSave"
            @click="handleSave"
          >
            <icon :name="saveIcon.icon.value" size="20" />
            <span>Save</span>
          </button>
          <button v-if="canRemove && member.role !== 'OWNER'" type="button" class="btn-danger" @click="handleRemove">
            <icon name="ph:user-minus-bold" size="20" />
            <span>Remove Member</span>
          </button>
        </nav>
      </footer>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  projectId: string
  member: ProjectMembership | null
  canRemove: boolean
}>()

const emit = defineEmits<{
  "update:isOpen": [value: boolean]
  "updated": []
}>()

const projectStore = useProjectStore()
const { confirm } = useUI()
const saveIcon = useActionIcon("ph:floppy-disk-bold")
const selectedRole = ref<"ADMIN" | "MEMBER">("MEMBER")
const selectedEnvironments = ref<Environment[]>(["DEVELOPMENT"])

const hasChanges = computed(() => {
  if (!props.member) {
    return false
  }
  if (selectedRole.value !== props.member.role) {
    return true
  }
  if (selectedRole.value !== "MEMBER") {
    return false
  }
  const current = [...(props.member.environment ?? [])].sort().join(",")
  const next = [...selectedEnvironments.value].sort().join(",")
  return current !== next
})

const canSave = computed(() => selectedRole.value === "ADMIN" || selectedEnvironments.value.length > 0)

function toggleEnvironment(env: Environment) {
  const idx = selectedEnvironments.value.indexOf(env)
  if (idx === -1) {
    selectedEnvironments.value.push(env)
  }
  else if (selectedEnvironments.value.length > 1) {
    selectedEnvironments.value.splice(idx, 1)
  }
}

async function handleSave() {
  if (!props.projectId || !props.member?.userId || props.member.role === "OWNER" || !canSave.value) {
    return
  }

  await projectStore.updateProjectMember(props.projectId, props.member.userId, {
    role: selectedRole.value,
    ...(selectedRole.value === "MEMBER" ? { environment: [...selectedEnvironments.value] } : {}),
  })
  await projectStore.getProjects()
  saveIcon.triggerSuccess()
  emit("updated")
  emit("update:isOpen", false)
}

async function handleRemove() {
  if (!props.projectId || !props.member?.userId) {
    return
  }
  if (!await confirm({ title: "Remove Member", message: "Are you sure you want to remove this member?", confirmLabel: "Remove", variant: "danger" })) {
    return
  }

  await projectStore.removeProjectMember(props.projectId, props.member.userId)
  await projectStore.getProjects()
  emit("updated")
  emit("update:isOpen", false)
}

// Sync form when the member changes
watch(() => props.member, (member) => {
  if (member && member.role !== "OWNER") {
    selectedRole.value = member.role as "ADMIN" | "MEMBER"
    selectedEnvironments.value = member.environment?.length ? [...member.environment] : ["DEVELOPMENT"]
  }
}, { immediate: true })
</script>
