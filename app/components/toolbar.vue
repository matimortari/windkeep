<template>
  <div class="fixed top-0 left-1/2 z-50 w-full -translate-x-1/2">
    <div class="flex flex-row items-center justify-between border-b-2 bg-card/50 p-2 backdrop-blur-xl">
      <nav class="navigation-group text-sm" aria-label="Breadcrumbs Navigation">
        <img src="/assets/symbol.png" alt="Logo" width="30">

        <div class="text-caption hidden md:navigation-group">
          <span>/</span>
          <span>{{ user?.name }}</span>
          <span>/</span>
        </div>

        <div ref="dropdownRef" class="relative">
          <button class="navigation-group truncate hover:underline" aria-label="Select Organization" @click="isDropdownOpen = !isDropdownOpen">
            <span class="text-caption">{{ activeOrg?.name }}</span>
            <icon name="ph:caret-down" size="20" class="hover:text-primary" :class="[isDropdownOpen ? 'rotate-180 text-muted-foreground' : 'rotate-0']" />
          </button>

          <transition name="dropdown" mode="out-in">
            <ul v-if="isDropdownOpen" class="dropdown-menu space-y-1 overflow-y-auto text-sm" role="menu" aria-label="User Organizations">
              <li v-for="org in orgs" :key="org.id" class="truncate whitespace-nowrap">
                <button
                  type="button" class="w-full cursor-pointer truncate rounded p-2 text-left hover:bg-muted"
                  :class="org.id === activeOrg?.id ? 'bg-muted' : ''" @click="org.id && handleSetActiveOrg(org.id)"
                >
                  {{ org.name }}
                </button>
              </li>

              <li class="truncate whitespace-nowrap">
                <nuxt-link to="/onboarding/create-org" class="group navigation-group block rounded p-2 hover:bg-muted" role="menuitem">
                  <icon name="ph:plus" size="20" class="text-primary transition-transform group-hover:scale-125" />
                  <span>Create Organization</span>
                </nuxt-link>
              </li>
            </ul>
          </transition>
        </div>

        <div class="text-caption hidden md:navigation-group">
          <span>/</span>
          <span class="capitalize">{{ currentPage }}</span>
        </div>
      </nav>

      <nav class="navigation-group" aria-label="User Actions">
        <nuxt-link to="/admin/preferences" title="User Preferences" aria-label="User Preferences" class="btn hidden! md:block!">
          <icon name="ph:user-circle-gear" size="20" />
        </nuxt-link>
        <button aria-label="Toggle Theme" class="btn" @click="toggleTheme()">
          <icon :name="themeIcon" size="20" />
        </button>
        <button class="btn md:hidden!" aria-label="Toggle Sidebar" @click="$emit('toggleSidebar')">
          <icon name="ph:list" size="20" />
        </button>
        <button class="btn" aria-label="Sign Out" @click="signOut">
          <icon name="ph:sign-out" size="20" />
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  orgs: Array<Organization> | null
}>()

defineEmits<(e: "toggleSidebar") => void>()

const { toggleTheme, themeIcon } = useTheme()
const { user } = storeToRefs(useUserStore())
const { activeOrg, organizations } = storeToRefs(useOrgStore())
const route = useRoute()
const orgStore = useOrgStore()
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

useClickOutside(dropdownRef, () => {
  isDropdownOpen.value = false
}, { escapeKey: true })

const currentPage = computed(() => {
  const segments = route.path.split("/").filter(Boolean)
  let page = segments.length ? segments[segments.length - 1] : "home"
  page = (page ?? "home").replaceAll("-", " ")

  return page.replace(/\b\w/g, l => l.toUpperCase())
})

async function handleSetActiveOrg(orgId: string) {
  if (!orgId) {
    return
  }

  isDropdownOpen.value = false
  const org = organizations.value.find((o: Organization) => o.id === orgId)
  if (!org) {
    const res = await orgStore.getOrg(orgId)
    if (res) {
      orgStore.setActiveOrg(res.id)
    }
    return
  }

  orgStore.setActiveOrg(org.id)
}
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(0.25rem);
}
.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
