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

async function goTo(path: string) {
  isLoading.value = false
  await navigateTo(path)
}

async function settled<T>(task: () => Promise<T>) {
  const [result] = await Promise.allSettled([task()])
  return result
}

onMounted(async () => {
  const userResult = await settled(() => userStore.getUser())
  if (userResult.status === "rejected" || !user.value) {
    await goTo("/sign-in")
    return
  }

  const activeOrg = user.value.orgMemberships?.find(m => m.isActive)
  const orgId = activeOrg?.orgId || activeOrg?.org?.id
  if (!activeOrg || !orgId) {
    await goTo("/onboarding")
    return
  }

  const orgResult = await settled(() => orgStore.getOrg(orgId))
  if (orgResult.status === "rejected") {
    await goTo("/sign-in")
    return
  }

  const projectsResult = await settled(() => projectStore.getProjects())
  if (projectsResult.status === "rejected") {
    await goTo("/sign-in")
    return
  }

  isLoading.value = false
})
</script>
