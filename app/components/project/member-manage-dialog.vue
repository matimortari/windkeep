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

      <footer class="flex flex-col gap-2 border-t pt-4">
        <button v-if="member.role !== 'OWNER' && selectedRole !== member.role" class="btn-success w-full" @click="handleUpdateRole">
          <icon :name="saveIcon.icon.value" size="20" />
          <span>Save Role</span>
        </button>

        <button v-if="canRemove && member.role !== 'OWNER'" class="btn w-full text-danger" @click="handleRemove">
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
  projectId: string
  member: ProjectMembership | null
  canRemove: boolean
}>()

const emit = defineEmits<{
  "update:isOpen": [value: boolean]
  "updated": []
}>()

const projectStore = useProjectStore()
const saveIcon = useActionIcon("ph:floppy-disk-bold")
const selectedRole = ref<"ADMIN" | "MEMBER">("MEMBER")

async function handleUpdateRole() {
  if (!props.projectId || !props.member?.userId || props.member.role === "OWNER") {
    return
  }

  await projectStore.updateProjectMember(props.projectId, props.member.userId, { role: selectedRole.value })
  await projectStore.getProjects()
  saveIcon.triggerSuccess()
  emit("updated")
  emit("update:isOpen", false)
}

async function handleRemove() {
  if (!props.projectId || !props.member?.userId) {
    return
  }
  if (!confirm("Are you sure you want to remove this member?")) {
    return
  }

  await projectStore.removeProjectMember(props.projectId, props.member.userId)
  await projectStore.getProjects()
  emit("updated")
  emit("update:isOpen", false)
}

watch(() => props.member, (member) => {
  if (member && member.role !== "OWNER") {
    selectedRole.value = member.role as "ADMIN" | "MEMBER"
  }
}, { immediate: true })
</script>
