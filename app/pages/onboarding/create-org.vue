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
      Already have an invite? <nuxt-link to="/onboarding/join-org" class="text-primary hover:underline">
        Join an Organization.
      </nuxt-link>
    </p>

    <p v-if="errors.createOrg" class="text-caption-danger">
      {{ errors.createOrg }}
    </p>
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const orgStore = useOrgStore()
const { errors } = storeToRefs(orgStore)
const localOrg = ref({ name: `${user.value?.name}'s Team` })

async function handleCreateOrg() {
  const org = await orgStore.createOrg(localOrg.value)
  if (!org) {
    return
  }

  orgStore.setActiveOrg(org.id)
  setTimeout(() => navigateTo("/admin/projects"), 2000)
}

onMounted(async () => {
  await userStore.getUser()
  localOrg.value.name = `${user.value?.name || user.value?.email || "My"}'s Team`
})

useHead({
  title: "Create Organization",
  link: [{ rel: "canonical", href: `${baseURL}/onboarding/create-org` }],
  meta: [{ name: "description", content: "Create your organization on WindKeep." }],
})

definePageMeta({
  middleware: "auth",
})
</script>
