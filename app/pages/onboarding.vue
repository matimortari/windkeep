<template>
  <div class="flex min-h-screen w-full items-center justify-center">
    <div
      v-motion :initial="{ opacity: 0 }"
      :visible-once="{ opacity: 1 }" :duration="800"
      class="w-full max-w-xl border-none bg-transparent py-32"
    >
      <header class="flex flex-col items-center gap-2 py-4 text-center">
        <h1 class="font-display">
          Welcome to WindKeep
        </h1>
        <p class="text-caption">
          Create an organization to get started, or accept an existing invitation.
        </p>
      </header>

      <div class="border-y">
        <button
          class="group flex w-full items-center justify-between p-4 font-semibold transition-colors hover:text-primary"
          @click="activeSection = activeSection === 'create' ? null : 'create'"
        >
          <h5>
            New Organization
          </h5>
          <icon
            name="ph:caret-down-bold" size="20"
            class="shrink-0 text-muted-foreground transition-transform group-hover:text-primary"
            :class="activeSection === 'create' ? 'rotate-180' : 'rotate-0'"
          />
        </button>

        <transition name="accordion">
          <form v-if="activeSection === 'create'" class="flex flex-col gap-2 p-4 pt-0" @submit.prevent="handleCreateOrg">
            <input v-model="localOrg.name" placeholder="Organization Name" type="text">
            <div class="flex gap-2">
              <input v-model="localOrg.description" placeholder="Description (optional)" type="text" class="flex-1">
              <input v-model="localOrg.website" placeholder="Website (optional)" type="url" class="flex-1">
            </div>
            <button class="btn-primary w-full" type="submit" :disabled="!localOrg.name">
              Create Organization
            </button>
          </form>
        </transition>
      </div>

      <div class="border-b">
        <button
          class="group flex w-full items-center justify-between p-4 font-semibold transition-colors hover:text-primary"
          @click="activeSection = activeSection === 'invite' ? null : 'invite'"
        >
          <h5>
            Accept Invitation
          </h5>
          <icon
            name="ph:caret-down-bold" size="20"
            class="shrink-0 text-muted-foreground transition-transform group-hover:text-primary" :class="activeSection === 'invite' ? 'rotate-180' : 'rotate-0'"
          />
        </button>

        <transition name="accordion">
          <form v-if="activeSection === 'invite'" class="flex flex-col gap-2 p-4 pt-0" @submit.prevent="handleAcceptInvite">
            <input v-model="token" placeholder="Invite Token" type="text">
            <button class="btn-secondary w-full" type="submit" :disabled="!token">
              Accept Invite
            </button>
          </form>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const route = useRoute()
const userStore = useUserStore()
const orgStore = useOrgStore()
const localOrg = ref({ name: "", description: "", website: "" })
const token = ref(route.query.token as string || "")
const activeSection = ref<"create" | "invite" | null>(route.query.token ? "invite" : "create")

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

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition:
    max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.25s ease;
  overflow: hidden;
}
.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}
.accordion-enter-to,
.accordion-leave-from {
  max-height: 300px;
  opacity: 1;
}
</style>
