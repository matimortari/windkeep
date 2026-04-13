<template>
  <header class="flex flex-col items-start gap-4 border-b py-2 md:flex-row md:items-center md:justify-between">
    <div class="navigation-group">
      <nuxt-link to="/admin/projects" aria-label="Go back" class="flex items-center">
        <icon name="ph:arrow-left-bold" size="30" class="text-muted-foreground hover:text-primary" />
      </nuxt-link>

      <h2 class="max-w-lg truncate">
        {{ project?.name }}
      </h2>
      <nuxt-link v-if="project?.website" :href="project?.website" target="_blank" aria-label="Visit project website">
        <icon name="ph:arrow-up-right-bold" size="20" class="text-muted-foreground hover:text-primary" />
      </nuxt-link>
    </div>

    <nav class="navigation-group w-full flex-1 justify-start md:justify-end" aria-label="Project Actions">
      <button
        v-if="hasPermission" class="btn-primary"
        :disabled="hasPendingChanges" aria-label="Add New Secret"
        @click="emit('openSecretsDialog')"
      >
        <span class="hidden md:inline">New Secret</span>
        <icon name="ph:plus-bold" size="20" />
      </button>

      <button v-if="hasPermission" class="btn-secondary" :disabled="hasPendingChanges" @click="emit('openEditorDialog')">
        <span>Raw Editor</span>
        <icon name="ph:text-indent-bold" size="20" />
      </button>

      <div ref="dropdownRef" class="relative">
        <button class="btn-secondary" :disabled="hasPendingChanges" @click="isDropdownOpen = !isDropdownOpen">
          <span>Export as .env</span>
          <icon name="ph:download-bold" size="20" />
        </button>

        <transition name="dropdown">
          <ul v-if="isDropdownOpen" class="dropdown-menu -left-8" role="menu">
            <li v-for="env in ENVIRONMENTS" :key="env.value">
              <button role="menuitem" class="w-full rounded-lg p-2 text-left capitalize hover:bg-muted/60" @click="handleExport(env.value)">
                {{ capitalizeFirst(env.label) }}
              </button>
            </li>
          </ul>
        </transition>
      </div>

      <button :aria-label="allVisible ? 'Hide all values' : 'Reveal all values'" class="btn" @click="emit('toggleAllVisible')">
        <icon :name="allVisible ? 'ph:eye-closed-bold' : 'ph:eye-bold'" size="20" />
      </button>

      <nuxt-link :to="`/admin/${props.project?.slug}/settings`" class="btn" aria-label="Project Settings">
        <icon name="ph:gear-bold" size="20" />
      </nuxt-link>

      <button v-if="hasPendingChanges" class="btn-success" aria-label="Save All Changes" @click="emit('save')">
        <icon name="ph:floppy-disk-bold" size="20" />
      </button>

      <button v-if="hasPendingChanges" class="btn-danger" aria-label="Discard Changes" @click="emit('discard')">
        <icon name="ph:x-bold" size="20" />
      </button>
    </nav>
  </header>
</template>

<script setup lang="ts">
const props = defineProps<{
  project?: Project
  hasPermission: boolean
  hasPendingChanges: boolean
  allVisible: boolean
}>()

const emit = defineEmits<{
  openSecretsDialog: []
  openEditorDialog: []
  export: [env: string]
  save: []
  discard: []
  toggleAllVisible: []
}>()

const dropdownRef = ref<HTMLElement | null>(null)
const isDropdownOpen = ref(false)

useClickOutside(dropdownRef, () => {
  isDropdownOpen.value = false
}, { escapeKey: true })

function handleExport(env: string) {
  emit("export", env)
  isDropdownOpen.value = false
}
</script>
