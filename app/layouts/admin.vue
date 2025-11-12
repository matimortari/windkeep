<template>
  <Loading v-if="isLoading" />

  <div v-show="!isLoading" class="min-h-screen">
    <Toolbar :orgs="orgs ?? []" :is-sidebar-open="isSidebarOpen" @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />

    <div class="flex flex-1 pb-8">
      <Sidebar v-if="user?.activeOrgId" :org="orgs.find(o => o.id === user?.activeOrgId)" :is-open="isSidebarOpen" @update:is-open="isSidebarOpen = $event" />
      <main class="flex flex-1 flex-col overflow-x-hidden p-4">
        <slot :active-org="user?.activeOrgId" />
      </main>
    </div>
  </div>

  <Footer />
</template>

<script setup lang="ts">
const { user, fetchUser } = useUserActions()
const { fetchProjects } = useProjectActions()

const isSidebarOpen = ref(false)
const isLoading = ref(true)

const orgs = computed(() =>
  user.value?.memberships?.map(m => ({
    id: m.organization?.id ?? m.organizationId,
    name: m.organization?.name ?? "",
    role: m.role,
  })) ?? [],
)

async function getUserData() {
  try {
    await fetchUser()
    if (user.value?.activeOrgId) {
      await fetchProjects()
    }
    else {
      await navigateTo("/onboarding/create-org")
    }
  }
  catch {
    await navigateTo("/sign-in")
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (document.readyState === "complete") {
    getUserData()
  }
  else {
    window.addEventListener("load", getUserData)
  }
})
</script>
