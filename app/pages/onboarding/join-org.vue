<template>
  <div class="flex w-full flex-col items-center justify-center">
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

    <p class="text-caption flex min-h-4 flex-col items-center gap-2">
      <span v-if="errors.acceptInvite" class="text-danger">{{ errors.acceptInvite }}</span>
      <span v-else-if="joinOrgSuccess" class="text-success">
        {{ joinOrgSuccess }}
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const userStore = useUserStore()
const orgStore = useOrgStore()
const { errors } = storeToRefs(orgStore)
const token = ref(route.query.token as string || "")
const joinOrgSuccess = ref<string | null>(null)

async function handleAcceptInvite() {
  errors.value.acceptInvite = null
  joinOrgSuccess.value = null

  try {
    const res = await orgStore.acceptInvite(token.value, { token: token.value })
    if (res) {
      joinOrgSuccess.value = "Invitation accepted! Redirecting."
      setTimeout(() => navigateTo("/admin/projects"), 2000)
    }
  }
  catch (err: any) {
    errors.value.acceptInvite = err.data.message
  }
}

onMounted(async () => {
  await userStore.getUser()
})

useHead({
  title: "Join Organization",
  link: [{ rel: "canonical", href: "https://secretkeepr.vercel.app/onboarding/join-org" }],
  meta: [{ name: "description", content: "Join an organization on SecretkeepR." }],
})

definePageMeta({
  middleware: auth,
})
</script>
