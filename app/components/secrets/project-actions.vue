<template>
  <header class="flex flex-col items-start gap-2 border-b py-2 md:flex-row md:items-center md:justify-between md:gap-4">
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

    <nav class="navigation-group w-full flex-1 flex-wrap justify-start md:justify-end" aria-label="Project Actions">
      <div class="relative hidden md:block">
        <input
          id="search" :value="searchQuery"
          type="text" placeholder="Search secrets..."
          @input="searchQuery = ($event.target as HTMLInputElement).value; emit('search', searchQuery)"
        >
        <span class="absolute inset-y-0 right-0 flex flex-row items-center pr-4 text-muted-foreground">
          <icon name="ph:magnifying-glass-bold" size="20" />
        </span>
      </div>

      <div v-if="availableTags.length" ref="tagDropdownRef" class="relative">
        <button
          class="btn" :class="activeTagFilter ? 'border-secondary! text-secondary!' : ''"
          :disabled="hasPendingChanges" aria-label="Filter by Tag"
          @click="isTagDropdownOpen = !isTagDropdownOpen"
        >
          <icon name="ph:tag-bold" size="20" />
          <span class="hidden md:inline">{{ activeTagFilter ? activeTagFilter : 'Tags' }}</span>
          <icon
            v-if="activeTagFilter" name="ph:x-bold"
            size="15" class="ml-0.5"
            @click.stop="emit('filterByTag', null)"
          />
          <icon v-else name="ph:caret-down-bold" size="15" />
        </button>

        <transition name="dropdown">
          <ul v-if="isTagDropdownOpen" class="dropdown-menu" role="menu">
            <li v-for="tag in availableTags" :key="tag">
              <button class="w-full rounded-lg p-2 text-left text-sm hover:bg-muted/60" :class="tag === activeTagFilter ? 'bg-muted font-medium' : ''" role="menuitem" @click="selectTag(tag)">
                {{ tag }}
              </button>
            </li>
          </ul>
        </transition>
      </div>

      <button :aria-label="allVisible ? 'Hide all values' : 'Reveal all values'" class="btn" @click="emit('toggleAllVisible')">
        <icon :name="allVisible ? 'ph:eye-closed-bold' : 'ph:eye-bold'" size="20" />
      </button>

      <button
        v-if="hasPermission" class="btn-secondary"
        aria-label="Bulk Edit" :disabled="hasPendingChanges"
        @click="emit('openEditorDialog')"
      >
        <span class="hidden md:inline">Bulk Edit</span>
        <icon name="ph:text-indent-bold" size="20" />
      </button>

      <div ref="exportDropdownRef" class="relative">
        <button class="btn-secondary" :disabled="hasPendingChanges" @click="isExportDropdownOpen = !isExportDropdownOpen">
          <span class="hidden md:inline">Export</span>
          <icon name="ph:download-bold" size="20" />
        </button>

        <transition name="dropdown">
          <ul v-if="isExportDropdownOpen" class="dropdown-menu -left-8" role="menu">
            <li v-for="env in ENVIRONMENTS" :key="env.value">
              <button role="menuitem" class="w-full rounded-lg p-2 text-left capitalize hover:bg-muted/60" @click="handleExport(env.value)">
                {{ capitalizeFirst(env.label) }}
              </button>
            </li>
          </ul>
        </transition>
      </div>

      <button
        v-if="hasPermission" class="btn-primary"
        :disabled="hasPendingChanges" aria-label="Add New Secret"
        @click="emit('openSecretsDialog')"
      >
        <span class="hidden md:inline">New Secret</span>
        <icon name="ph:plus-bold" size="20" />
      </button>

      <nuxt-link :to="`/admin/${props.project?.slug}/settings`" :class="hasPendingChanges ? 'hidden' : 'btn'" aria-label="Project Settings">
        <icon name="ph:gear-bold" size="20" />
      </nuxt-link>

      <div v-if="hasPendingChanges" class="navigation-group">
        <button class="btn-success" aria-label="Save All Changes" @click="emit('save')">
          <icon name="ph:floppy-disk-bold" size="20" />
          <span class="hidden md:inline">Save Changes</span>
        </button>
        <button class="btn-warning" aria-label="Discard Changes" @click="emit('discard')">
          <icon name="ph:x-bold" size="20" />
          <span class="hidden md:inline">Discard</span>
        </button>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
const props = defineProps<{
  project?: Project
  hasPermission: boolean
  hasPendingChanges: boolean
  allVisible: boolean
  availableTags: string[]
  activeTagFilter: string | null
}>()

const emit = defineEmits<{
  openSecretsDialog: []
  openEditorDialog: []
  export: [env: string]
  save: []
  discard: []
  toggleAllVisible: []
  filterByTag: [tag: string | null]
  search: [query: string]
}>()

const exportDropdownRef = ref<HTMLElement | null>(null)
const tagDropdownRef = ref<HTMLElement | null>(null)
const isExportDropdownOpen = ref(false)
const isTagDropdownOpen = ref(false)
const searchQuery = ref("")

useClickOutside(exportDropdownRef, () => {
  isExportDropdownOpen.value = false
}, { escapeKey: true })

useClickOutside(tagDropdownRef, () => {
  isTagDropdownOpen.value = false
}, { escapeKey: true })

function handleExport(env: string) {
  emit("export", env)
  isExportDropdownOpen.value = false
}

function selectTag(tag: string) {
  emit("filterByTag", tag === props.activeTagFilter ? null : tag)
  isTagDropdownOpen.value = false
}
</script>
