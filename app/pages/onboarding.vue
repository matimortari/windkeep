<template>
  <div class="flex min-h-screen w-full flex-col items-center justify-center">
    <header
      v-motion class="flex flex-col items-center gap-4 border-b-2 p-4 text-center"
      :initial="{ opacity: 0, y: -10, scale: 0.8 }" :visible="{ opacity: 1, y: 0, scale: 1 }"
      :duration="800"
    >
      <h1 class="font-display">
        Welcome to WindKeep
      </h1>
      <p class="text-caption">
        To get started, please create an organization name with at least 3 characters.
      </p>
    </header>

    <form
      v-motion class="flex min-w-lg flex-col items-center gap-2 p-4"
      :initial="{ opacity: 0 }" :visible="{ opacity: 1 }"
      :duration="800" @submit.prevent="handleCreateOrg"
    >
      <input v-model="localOrg.name" placeholder="Organization Name" type="text" autofocus>

      <button class="btn-primary w-full" type="submit" aria-label="Create Organization">
        Create Organization
      </button>
    </form>

    <p class="text-caption">
      Already have an invite? Enter the invitation token below:
    </p>
    <form
      v-motion class="flex min-w-lg flex-col items-center gap-2 p-4"
      :initial="{ opacity: 0 }" :visible="{ opacity: 1 }"
      :duration="800" @submit.prevent="handleAcceptInvite"
    >
      <input v-model="token" placeholder="Invite Token" type="text" autofocus>

      <button class="btn-primary w-full" type="submit">
        Accept Invite
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const route = useRoute()
const userStore = useUserStore()
const orgStore = useOrgStore()
const localOrg = ref({ name: `${userStore.user?.name}'s Team` })
const token = ref(route.query.token as string || "")

async function handleCreateOrg() {
  const org = await orgStore.createOrg(localOrg.value)
  if (!org) {
    return
  }

  orgStore.setActiveOrg(org.id)
  setTimeout(navigateTo, 2000, "/admin/projects")
}

async function handleAcceptInvite() {
  const res = await orgStore.acceptInvite(token.value, { token: token.value })
  if (res) {
    setTimeout(navigateTo, 2000, "/admin/projects")
  }
}

onMounted(async () => {
  await userStore.getUser()
  localOrg.value.name = `${userStore.user?.name || userStore.user?.email || "My"}'s Team`
})

useHead({
  title: "Onboarding",
  link: [{ rel: "canonical", href: `${baseURL}/onboarding` }],
  meta: [{ name: "description", content: "Get started with WindKeep by creating an organization or accepting an invitation." }],
})

definePageMeta({
  middleware: "auth",
})
</script>
