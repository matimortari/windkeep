<template>
  <div v-if="user" class="navigation-group justify-between border-b-2 bg-card px-4 py-2">
    <div class="navigation-group">
      <Logo class="hidden md:flex" />

      <nav class="navigation-group text-sm" aria-label="Breadcrumbs Navigation">
        <div class="text-caption hidden md:navigation-group">
          <span>/</span>
          <span>{{ user.name }}</span>
          <span>/</span>
        </div>

        <div ref="dropdownRef" class="relative">
          <button class="navigation-group truncate hover:underline" aria-label="Select Organization" @click="isDropdownOpen = !isDropdownOpen">
            <span class="text-caption">{{ orgs.find(org => org.id === user?.activeOrgId)?.name }}</span>
            <icon name="ph:caret-down-bold" size="20" class="transition-transform" :class="[isDropdownOpen ? 'rotate-180 text-muted-foreground' : 'rotate-0']" />
          </button>

          <transition name="dropdown" mode="out-in">
            <ul v-if="isDropdownOpen" class="dropdown-menu scroll-area space-y-1 overflow-y-auto text-sm" role="menu" aria-label="User Organizations">
              <li v-for="org in orgs" :key="org.id" class="truncate whitespace-nowrap">
                <button type="button" class="w-full cursor-pointer truncate rounded p-2 text-left hover:bg-muted" :class="org.id === user.activeOrgId ? 'bg-muted' : ''" @click="org.id && setActiveOrg(org.id)">
                  {{ org.name }}
                </button>
              </li>

              <li class="truncate whitespace-nowrap">
                <nuxt-link to="/onboarding/create-org" class="group navigation-group block rounded p-2 hover:bg-muted" role="menuitem">
                  <icon name="ph:plus-bold" size="20" class="text-accent transition-transform group-hover:scale-125" />
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
    </div>

    <nav class="navigation-group" aria-label="User Actions">
      <nuxt-link to="/admin/preferences" title="User Preferences" aria-label="User Preferences" class="btn hidden! md:block!">
        <icon name="ph:user-bold" size="20" />
      </nuxt-link>
      <button aria-label="Toggle Theme" class="btn" @click="toggleTheme()">
        <icon :name="themeIcon" size="20" />
      </button>
      <button class="btn md:hidden!" aria-label="Toggle Sidebar" @click="$emit('toggleSidebar')">
        <icon :name="props.isSidebarOpen ? 'ph:x-bold' : 'ph:list-bold'" size="20" />
      </button>
      <button class="btn" aria-label="Sign Out" @click="signOut">
        <icon name="ph:sign-out-bold" size="20" />
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  orgs: Array<Organization>
  isSidebarOpen: boolean
}>()

defineEmits<(e: "toggleSidebar") => void>()

const { toggleTheme, themeIcon } = useTheme()
const { clear } = useUserSession()
const route = useRoute()
const { user, setCurrentOrganization, errors } = useUserActions()

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

async function setActiveOrg(orgId: string) {
  if (!orgId)
    return

  try {
    isDropdownOpen.value = false
    await setCurrentOrganization(orgId)
  }
  catch (err: any) {
    errors.value.setActiveOrg = err.message
  }
}

async function signOut() {
  await clear()
  return navigateTo("/")
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
