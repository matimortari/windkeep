<template>
  <div class="flex min-h-screen w-full flex-col items-center justify-center">
    <header
      v-motion class="flex flex-col items-center gap-4 border-b-2 p-4 text-center"
      :initial="{ opacity: 0, y: -10, scale: 0.8 }" :visible="{ opacity: 1, y: 0, scale: 1 }"
      :duration="800"
    >
      <h1 class="font-display">
        Join Organization
      </h1>
      <p class="text-caption">
        To join an organization, please enter your invite token below.
      </p>
    </header>

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
const token = ref(route.query.token as string || "")

async function handleAcceptInvite() {
  const res = await orgStore.acceptInvite(token.value, { token: token.value })
  if (res) {
    setTimeout(() => navigateTo("/admin/projects"), 2000)
  }
}

onMounted(async () => await userStore.getUser())

useHead({
  title: "Join Organization",
  link: [{ rel: "canonical", href: `${baseURL}/onboarding/join-org` }],
  meta: [{ name: "description", content: "Join an organization on WindKeep." }],
})

definePageMeta({
  middleware: "auth",
})
</script>
