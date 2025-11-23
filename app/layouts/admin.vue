<template>
  <Toolbar :orgs="orgs" :is-sidebar-open="isSidebarOpen" @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />

  <Loading v-if="isLoading" />

  <div v-show="!isLoading" class="flex min-h-screen overflow-hidden py-12">
    <Sidebar v-if="activeOrg" :org="activeOrg" :is-open="isSidebarOpen" @update:is-open="isSidebarOpen = $event" />

    <main class="flex flex-1 flex-col overflow-x-hidden p-4">
      <slot :active-org="activeOrg" />
    </main>
  </div>

  <Footer />
</template>

<script setup lang="ts">
const { user, fetchUser } = useUserActions()
const { activeOrg, setActiveOrg, activeMembership } = useOrgActions()
const { fetchProjects } = useProjectActions()

const isSidebarOpen = ref(false)
const isLoading = ref(true)

const orgs = computed(() =>
  user.value?.orgMemberships?.map(m => ({
    id: m.org?.id ?? m.orgId,
    name: m.org?.name ?? "",
    role: m.role,
  })) ?? [],
)

async function getUserData() {
  try {
    await fetchUser()
    if (!activeMembership.value) {
      return navigateTo("/onboarding/create-org")
    }

    await setActiveOrg(activeMembership.value.orgId)

    await fetchProjects()
  }
  catch {
    await navigateTo("/sign-in")
  }
  finally {
    isLoading.value = false
  }
}

onMounted(getUserData)
</script>
