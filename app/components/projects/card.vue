<template>
  <nuxt-link :to="{ path: `/admin/${project.slug}`, query: { t: 'secrets' } }">
    <div class="card relative flex h-50 w-full flex-col justify-between overflow-hidden">
      <div class="flex flex-col gap-2 pr-8">
        <h4 class="truncate">
          {{ project.name }}
        </h4>
        <p v-if="project.website" class="text-caption text-xs!">
          {{ project.website }}
        </p>
        <p class="text-caption line-clamp-3">
          {{ project.description || 'No description provided.' }}
        </p>
      </div>

      <div ref="menuRef" class="absolute top-2 right-2 z-10" @click.stop.prevent>
        <button
          type="button" class="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-secondary"
          aria-label="Project menu" :aria-expanded="isMenuOpen"
          @click="isMenuOpen = !isMenuOpen"
        >
          <icon name="ph:dots-three-bold" size="25" />
        </button>

        <transition name="dropdown">
          <ul v-if="isMenuOpen" class="dropdown-menu" role="menu">
            <li>
              <button type="button" class="navigation-group w-full rounded-lg p-2 text-left hover:bg-muted/60" role="menuitem" @click="navigate('secrets')">
                <icon name="ph:key-bold" size="20" />
                <span>Secrets</span>
              </button>
            </li>
            <li>
              <button type="button" class="navigation-group w-full rounded-lg p-2 text-left hover:bg-muted/60" role="menuitem" @click="navigate('access-control')">
                <icon name="ph:shield-check-bold" size="20" />
                <span>Access Control</span>
              </button>
            </li>
            <li>
              <button type="button" class="navigation-group w-full rounded-lg p-2 text-left hover:bg-muted/60" role="menuitem" @click="navigate('settings')">
                <icon name="ph:gear-bold" size="20" />
                <span>Settings</span>
              </button>
            </li>
          </ul>
        </transition>
      </div>

      <footer class="text-caption flex items-center justify-between gap-4">
        <div class="navigation-group">
          <div class="flex flex-row items-center gap-1" title="Members">
            <icon name="ph:users-bold" size="20" />
            <span>{{ project._count?.memberships ?? project.memberships?.length ?? 0 }}</span>
          </div>

          <div class="flex flex-row items-center gap-1" title="Access Tokens">
            <icon name="ph:keyhole-bold" size="20" />
            <span>{{ project._count?.serviceTokens ?? 0 }}</span>
          </div>

          <div class="flex flex-row items-center gap-1" title="Secrets">
            <icon name="ph:key-bold" size="20" />
            <span>{{ project._count?.secrets ?? 0 }}</span>
          </div>
        </div>

        <span class="text-xs!">Updated {{ project.updatedAt ? formatDate(project.updatedAt) : 'never' }}</span>
      </footer>
    </div>
  </nuxt-link>
</template>

<script setup lang="ts">
const props = defineProps<{
  project: Project
}>()

const { setTab, setActiveProject } = useUIState()
const isMenuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
useClickOutside(menuRef, () => isMenuOpen.value = false, { escapeKey: true })

function navigate(tab: "secrets" | "access-control" | "settings") {
  isMenuOpen.value = false
  setActiveProject(props.project.slug)
  setTab("project", tab)
  navigateTo({ path: `/admin/${props.project.slug}`, query: { t: tab } })
}
</script>
