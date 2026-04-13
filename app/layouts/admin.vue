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

function runSafely(task: () => Promise<unknown>) {
  return task().then(() => true, () => false)
}

onMounted(async () => {
  if (!await runSafely(() => userStore.getUser())) {
    await goTo("/sign-in")
    return
  }

  const activeOrg = user.value?.orgMemberships?.find(m => m.isActive)
  if (!activeOrg) {
    await goTo("/onboarding")
    return
  }

  if (!await runSafely(() => orgStore.getOrg(activeOrg.orgId))) {
    await goTo("/sign-in")
    return
  }

  orgStore.setActiveOrg(activeOrg.orgId)

  if (!await runSafely(() => projectStore.getProjects())) {
    await goTo("/sign-in")
    return
  }

  isLoading.value = false
})
</script>
