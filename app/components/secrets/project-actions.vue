<template>
  <nav class="navigation-group w-full justify-end md:w-auto" aria-label="Project Actions">
    <div class="hidden min-w-0 flex-1 md:relative md:flex-none">
      <input
        id="search" :value="searchQuery"
        type="text" placeholder="Search secrets..."
        aria-label="Search secrets" @input="searchQuery = ($event.target as HTMLInputElement).value; emit('search', searchQuery)"
      >
      <span class="absolute inset-y-0 right-0 flex flex-row items-center pr-4 text-muted-foreground">
        <icon name="ph:magnifying-glass-bold" size="20" />
      </span>
    </div>

    <div v-if="availableTags.length" ref="tagDropdownRef" class="relative">
      <button
        type="button"
        class="btn" :class="activeTagFilter ? 'border-secondary! text-secondary!' : ''"
        :disabled="hasPendingChanges" aria-label="Filter by Tag"
        @click="isTagDropdownOpen = !isTagDropdownOpen"
      >
        <icon name="ph:tag-bold" size="20" />
        <span>{{ activeTagFilter ? activeTagFilter : 'Tags' }}</span>
        <icon v-if="activeTagFilter" name="ph:x-bold" size="15" @click.stop="emit('filterByTag', null)" />
        <icon v-else name="ph:caret-down-bold" size="15" />
      </button>

      <transition name="dropdown">
        <ul v-if="isTagDropdownOpen" class="dropdown-menu" role="menu">
          <li v-for="tag in availableTags" :key="tag">
            <button
              type="button" class="w-full rounded-lg p-2 text-left text-sm hover:bg-muted/60"
              :class="tag === activeTagFilter ? 'bg-muted font-medium' : ''" role="menuitem"
              @click="selectTag(tag)"
            >
              {{ tag }}
            </button>
          </li>
        </ul>
      </transition>
    </div>

    <button type="button" :aria-label="allVisible ? 'Hide all values' : 'Reveal all values'" class="btn" @click="emit('toggleAllVisible')">
      <icon :name="allVisible ? 'ph:eye-closed-bold' : 'ph:eye-bold'" size="20" />
    </button>

    <button
      v-if="hasPermission" type="button"
      class="btn-secondary"
      aria-label="Bulk Edit" :disabled="hasPendingChanges"
      @click="emit('openEditorDialog')"
    >
      <span class="hidden md:inline">Bulk Edit</span>
      <icon name="ph:text-indent-bold" size="20" />
    </button>

    <div ref="exportDropdownRef" class="relative">
      <button type="button" class="btn-secondary" :disabled="hasPendingChanges" @click="isExportDropdownOpen = !isExportDropdownOpen">
        <span class="hidden md:inline">Export</span>
        <icon name="ph:download-bold" size="20" />
      </button>

      <transition name="dropdown">
        <ul v-if="isExportDropdownOpen" class="dropdown-menu" role="menu">
          <li v-for="env in ENVIRONMENTS" :key="env.value">
            <button type="button" role="menuitem" class="w-full rounded-lg p-2 text-left capitalize hover:bg-muted/60" @click="handleExport(env.value)">
              {{ env.label }}
            </button>
          </li>
        </ul>
      </transition>
    </div>

    <button
      v-if="hasPermission" type="button"
      class="btn-primary"
      :disabled="hasPendingChanges" aria-label="Add New Secret"
      @click="emit('openSecretsDialog')"
    >
      <span class="hidden md:inline">New Secret</span>
      <icon name="ph:plus-bold" size="20" />
    </button>

    <div v-if="hasPendingChanges" class="navigation-group">
      <button type="button" class="btn-success" aria-label="Save All Changes" @click="emit('save')">
        <icon name="ph:floppy-disk-bold" size="20" />
        <span class="hidden md:inline">Save Changes</span>
      </button>
      <button type="button" class="btn-warning" aria-label="Discard Changes" @click="emit('discard')">
        <icon name="ph:x-bold" size="20" />
        <span class="hidden md:inline">Discard</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{
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
const searchQuery = ref("")
const isExportDropdownOpen = ref(false)
const isTagDropdownOpen = ref(false)
useClickOutside(exportDropdownRef, () => isExportDropdownOpen.value = false, { escapeKey: true })
useClickOutside(tagDropdownRef, () => isTagDropdownOpen.value = false, { escapeKey: true })

function handleExport(env: string) {
  emit("export", env)
  isExportDropdownOpen.value = false
}

function selectTag(tag: string) {
  emit("filterByTag", tag === props.activeTagFilter ? null : tag)
  isTagDropdownOpen.value = false
}
</script>
