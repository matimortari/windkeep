<template>
  <Toolbar :orgs="user?.orgMemberships?.map(m => m.org) ?? []" @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />

  <div class="flex min-h-screen overflow-hidden py-12">
    <Sidebar :org="activeOrg" :is-open="isSidebarOpen" @update:is-open="isSidebarOpen = $event" />

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
const { activeOrg } = storeToRefs(orgStore)
const isSidebarOpen = ref(false)
const isLoading = ref(true)

onMounted(async () => {
  try {
    await userStore.getUser()
    const activeMembership = userStore.user?.orgMemberships?.find(m => m.isActive)
    if (!activeMembership) {
      return navigateTo("/onboarding/create-org")
    }

    await orgStore.getOrg(activeMembership.orgId)
    orgStore.setActiveOrg(activeMembership.orgId)

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
