<template>
  <Toolbar :orgs="user?.orgMemberships?.map(m => m.org) ?? []" @toggle-sidebar="toggleSidebar" />

  <div class="flex min-h-screen overflow-hidden py-12">
    <Sidebar :is-open="isSidebarOpen" :loading="isLoading" @update:is-open="value => value ? openSidebar() : closeSidebar()" />

    <main class="flex flex-1 flex-col overflow-x-hidden p-4">
      <Loading v-if="isLoading" />
      <slot v-else />
    </main>
  </div>

  <Footer />
</template>

<script setup lang="ts">
const userStore = useUserStore()
const orgStore = useOrgStore()
const projectStore = useProjectStore()
const { user } = storeToRefs(userStore)
const { isSidebarOpen, toggleSidebar, openSidebar, closeSidebar } = useUIState()
const isLoading = ref(true)

onMounted(async () => {
  try {
    await userStore.getUser()
    const activeOrg = user.value?.orgMemberships?.find(m => m.isActive)
    if (!activeOrg) {
      return navigateTo("/onboarding")
    }

    await orgStore.getOrg(activeOrg.orgId)
    orgStore.setActiveOrg(activeOrg.orgId)
    await projectStore.getProjects()
  }
  catch {
    await navigateTo("/sign-in")
  }
  finally {
    isLoading.value = false
  }
})
</script>
