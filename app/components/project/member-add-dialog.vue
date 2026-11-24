<template>
  <Dialog :is-open="isOpen" title="Add Member" @update:is-open="emit('update:isOpen', $event)">
    <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <Empty v-if="!availableMembers.length" message="No available organization members to add." icon-name="ph:users-three-bold" />

      <template v-else>
        <div class="flex flex-col items-start gap-1">
          <label id="project-member-label" class="text-sm font-semibold">Member</label>
          <div ref="dropdownRef" class="relative w-full">
            <button
              type="button" class="btn w-full justify-between"
              aria-haspopup="listbox" :aria-expanded="isDropdownOpen"
              aria-labelledby="project-member-label" @click="isDropdownOpen = !isDropdownOpen"
            >
              <span class="navigation-group min-w-0 flex-1">
                <img v-if="selectedMember?.user.image" :src="selectedMember.user.image" alt="Avatar" class="size-5 rounded-full border">
                <span class="truncate">{{ selectedMember ? selectedMember.user.name : "Select a member..." }}</span>
              </span>
              <icon name="ph:caret-down-bold" size="20" class="shrink-0" :class="isDropdownOpen ? 'rotate-180' : 'rotate-0'" />
            </button>

            <transition name="dropdown">
              <ul v-if="isDropdownOpen" class="dropdown-menu max-h-60 w-full" role="listbox" aria-labelledby="project-member-label">
                <li v-for="member in availableMembers" :key="member.user.id" role="presentation">
                  <button
                    type="button" role="option"
                    :aria-selected="selectedUserId === member.user.id" class="navigation-group w-full truncate rounded-lg p-2 text-left hover:bg-muted/60"
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

        <div v-if="role === 'MEMBER'" class="flex flex-col items-start gap-1">
          <span class="text-sm font-semibold">Environments</span>
          <span class="text-xs text-muted-foreground">Member can only read secrets from selected environments.</span>
          <div class="navigation-group flex-wrap">
            <button
              v-for="env in ENVIRONMENTS" :key="env.value"
              type="button" class="btn-ghost"
              :class="environments.includes(env.value) ? 'border-secondary! text-secondary!' : ''"
              @click="toggleEnvironment(env.value)"
            >
              {{ env.label }}
            </button>
          </div>
        </div>
        <p v-else class="text-xs text-muted-foreground">
          Admins can read secrets from all environments.
        </p>
      </template>

      <footer class="flex flex-row items-center justify-end">
        <nav class="navigation-group">
          <button type="button" class="btn-ghost" @click="emit('update:isOpen', false)">
            Cancel
          </button>
          <button v-if="availableMembers.length" type="submit" class="btn-success" :disabled="!canSubmit">
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
const environments = ref<Environment[]>(["DEVELOPMENT"])
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
useClickOutside(dropdownRef, () => isDropdownOpen.value = false, { escapeKey: true })
const selectedMember = computed(() => props.availableMembers.find(m => m.user.id === selectedUserId.value))
const canSubmit = computed(() => !!selectedUserId.value && (role.value === "ADMIN" || environments.value.length > 0))

function toggleEnvironment(env: Environment) {
  const idx = environments.value.indexOf(env)
  if (idx === -1) {
    environments.value.push(env)
  }
  else if (environments.value.length > 1) {
    environments.value.splice(idx, 1)
  }
}

function resetForm() {
  selectedUserId.value = ""
  role.value = "MEMBER"
  environments.value = ["DEVELOPMENT"]
  isDropdownOpen.value = false
}

async function handleSubmit() {
  if (!props.projectId || !selectedUserId.value || !canSubmit.value) {
    return
  }

  await projectStore.addProjectMember(props.projectId, {
    userId: selectedUserId.value,
    role: role.value,
    ...(role.value === "MEMBER" ? { environment: [...environments.value] } : {}),
  })
  await projectStore.getProjects()
  emit("added")
  emit("update:isOpen", false)
}

// Reset form when dialog is opened
watch(() => props.isOpen, (open) => {
  if (open) {
    resetForm()
  }
}, { immediate: true })
</script>
