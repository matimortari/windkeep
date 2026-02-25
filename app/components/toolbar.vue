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
          <button class="navigation-group truncate" aria-label="Select Organization" @click="isDropdownOpen = !isDropdownOpen">
            <span class="text-caption">{{ activeOrg?.name }}</span>
            <icon name="ph:caret-down-bold" size="20" class="transition-all hover:text-primary" :class="[isDropdownOpen ? 'rotate-180 text-muted-foreground' : 'rotate-0']" />
          </button>

          <transition name="dropdown">
            <ul v-if="isDropdownOpen" class="dropdown-menu" role="menu">
              <li v-for="org in orgs" :key="org.id" class="whitespace-nowrap">
                <button class="w-full truncate rounded-lg p-2 text-left hover:bg-muted/60" :class="org.id === activeOrg?.id ? 'bg-muted' : ''" @click="org.id && handleSetActiveOrg(org.id)">
                  {{ org.name }}
                </button>
              </li>

              <li>
                <nuxt-link to="/onboarding/create-org" class="group navigation-group rounded-lg p-2 whitespace-nowrap hover:bg-muted/60" role="menuitem">
                  <icon name="ph:plus-bold" size="20" class="text-primary transition-transform group-hover:scale-125" />
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
          <icon name="ph:user-circle-gear-bold" size="20" />
        </nuxt-link>
        <button aria-label="Toggle Theme" class="btn" @click="toggleTheme()">
          <icon :name="themeIcon" size="20" />
        </button>
        <button class="btn md:hidden!" aria-label="Toggle Sidebar" @click="emit('toggleSidebar')">
          <icon name="ph:list-bold" size="20" />
        </button>
        <button class="btn" aria-label="Sign Out" @click="signOut">
          <icon name="ph:sign-out-bold" size="20" />
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  orgs: Array<Organization> | null
}>()

const emit = defineEmits<{ toggleSidebar: [] }>()

const { toggleTheme, themeIcon } = useTheme()
const route = useRoute()
const router = useRouter()
const orgStore = useOrgStore()
const { activeOrg, organizations } = storeToRefs(orgStore)
const { user } = storeToRefs(useUserStore())
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
  if (!organizations.value.some(o => o.id === orgId)) {
    await orgStore.getOrg(orgId)
  }

  orgStore.setActiveOrg(orgId)
  await router.push("/admin/projects")
}
</script>
