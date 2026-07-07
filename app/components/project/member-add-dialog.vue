<template>
  <Dialog :is-open="isOpen" title="Add Member" @update:is-open="emit('update:isOpen', $event)">
    <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <Empty v-if="!availableMembers.length" message="No available organization members to add." icon-name="ph:users-three-bold" />

      <template v-else>
        <div class="flex flex-col items-start gap-1">
          <label class="text-sm font-semibold">Member</label>
          <div ref="dropdownRef" class="relative w-full">
            <button type="button" class="btn w-full justify-between" @click="isDropdownOpen = !isDropdownOpen">
              <span class="truncate">{{ selectedMember ? selectedMember.user.name : "Select a member..." }}</span>
              <icon name="ph:caret-down-bold" size="20" :class="isDropdownOpen ? 'rotate-180' : 'rotate-0'" />
            </button>

            <transition name="dropdown">
              <ul v-if="isDropdownOpen" class="dropdown-menu max-h-60 w-full" role="menu">
                <li v-for="member in availableMembers" :key="member.user.id">
                  <button
                    type="button" class="navigation-group w-full truncate rounded-lg p-2 text-left hover:bg-muted/60"
                    :class="selectedUserId === member.user.id ? 'bg-muted' : ''" @click="selectedUserId = member.user.id; isDropdownOpen = false"
                  >
                    <img :src="member.user.image" alt="Avatar" class="size-6 rounded-full border">
                    <div class="flex flex-col truncate">
                      <span class="truncate font-semibold">{{ member.user.name }}</span>
                      <span class="text-xs text-muted-foreground">{{ member.user.email }}</span>
                    </div>
                  </button>
                </li>
              </ul>
            </transition>
          </div>
        </div>

        <div class="flex flex-col items-start gap-1">
          <label for="project-member-role" class="text-sm font-semibold">Role</label>
          <select id="project-member-role" v-model="role" class="w-full">
            <option v-for="r in ROLES.filter(r => r.value !== 'OWNER')" :key="r.value" :value="r.value">
              {{ r.label }}
            </option>
          </select>
        </div>
      </template>

      <footer class="flex flex-row items-center justify-end">
        <nav class="navigation-group">
          <button type="button" class="btn-ghost" @click="emit('update:isOpen', false)">
            Cancel
          </button>
          <button v-if="availableMembers.length" class="btn-success" type="submit" :disabled="!selectedUserId">
            <icon name="ph:plus-circle-bold" size="20" />
            <span>Add Member</span>
          </button>
        </nav>
      </footer>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  projectId: string
  availableMembers: OrgMembership[]
}>()

const emit = defineEmits<{
  "update:isOpen": [value: boolean]
  "added": []
}>()

const projectStore = useProjectStore()
const selectedUserId = ref("")
const role = ref<"ADMIN" | "MEMBER">("MEMBER")
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
useClickOutside(dropdownRef, () => isDropdownOpen.value = false, { escapeKey: true })
const selectedMember = computed(() => props.availableMembers.find(m => m.user.id === selectedUserId.value))

function resetForm() {
  selectedUserId.value = ""
  role.value = "MEMBER"
  isDropdownOpen.value = false
}

async function handleSubmit() {
  if (!props.projectId || !selectedUserId.value) {
    return
  }

  await projectStore.addProjectMember(props.projectId, {
    userId: selectedUserId.value,
    role: role.value,
  })
  await projectStore.getProjects()
  emit("added")
  emit("update:isOpen", false)
}

watch(() => props.isOpen, (open) => {
  if (open) {
    resetForm()
  }
}, { immediate: true })
</script>
