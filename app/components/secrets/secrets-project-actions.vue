<template>
  <header class="flex flex-col items-start gap-4 border-b py-2 md:flex-row md:items-center md:justify-between">
    <div class="navigation-group">
      <nuxt-link to="/admin/projects" aria-label="Go back" class="flex items-center">
        <icon name="ph:arrow-left-bold" size="30" class="text-muted-foreground hover:text-primary" />
      </nuxt-link>

      <h2 class="max-w-lg truncate">
        {{ projectName }}
      </h2>
    </div>

    <nav class="navigation-group w-full flex-1 justify-start md:justify-end" aria-label="Project Actions">
      <button v-if="canManage" class="btn-primary" @click="emit('openSecretsDialog')">
        <span class="hidden md:inline">New Secret</span>
        <icon name="ph:plus-bold" size="20" />
      </button>

      <button v-if="canManage" class="btn-secondary" aria-label="Import Secrets from .env File" @click="emit('openImportDialog')">
        <span>Import</span>
        <icon name="ph:upload-bold" size="20" />
      </button>

      <div ref="dropdownRef" class="relative">
        <button class="btn-secondary" aria-label="Export Secrets to .env File" @click="isDropdownOpen = !isDropdownOpen">
          <span>Export</span>
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

      <nuxt-link :to="`/admin/${props.projectSlug}/settings`" class="btn">
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
  projectName?: string
  projectSlug?: string
  canManage: boolean
  hasPendingChanges: boolean
}>()

const emit = defineEmits<{
  openSecretsDialog: []
  openImportDialog: []
  export: [env: string]
  save: []
  discard: []
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
