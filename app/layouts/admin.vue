<template>
  <Loading v-if="isLoading" />

  <div v-show="!isLoading" class="min-h-screen">
    <Toolbar :orgs="orgs" :org="user?.activeOrgId" :is-sidebar-open="isSidebarOpen" @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />

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
const userStore = useUserStore()
const projectStore = useProjectStore()

const isSidebarOpen = ref(false)
const isLoading = ref(true)

const user = computed(() => userStore.user)
const orgs = computed(() => userStore.organizations)

async function getUserData() {
  try {
    await userStore.getUser()
    if (userStore.user?.activeOrgId) {
      await projectStore.getProjects()
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
