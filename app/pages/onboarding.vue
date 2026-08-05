<template>
  <div class="flex min-h-screen w-full items-center justify-center">
    <div class="onboarding-panel w-full max-w-xl border-none bg-transparent py-32">
      <header class="flex flex-col items-center gap-2 py-4 text-center">
        <h1 class="font-display">
          Welcome to WindKeep
        </h1>
        <p class="text-caption">
          Create an organization to get started, or accept an existing invitation.
        </p>
      </header>

      <div class="border-y">
        <button type="button" class="group flex w-full items-center justify-between p-4 font-semibold transition-colors hover:text-primary" @click="activeSection = activeSection === 'create' ? null : 'create'">
          <h5>
            New Organization
          </h5>
          <icon name="ph:caret-down-bold" size="20" class="shrink-0 text-muted-foreground transition-transform group-hover:text-primary" :class="activeSection === 'create' ? 'rotate-180' : 'rotate-0'" />
        </button>

        <div class="accordion" :class="{ 'accordion--open': activeSection === 'create' }">
          <div class="accordion-panel">
            <form class="flex flex-col gap-2 p-2" @submit.prevent="handleCreateOrg">
              <input v-model="localOrg.name" placeholder="Organization Name" type="text">
              <div class="flex gap-2">
                <input v-model="localOrg.description" placeholder="Description (optional)" type="text" class="flex-1">
                <input v-model="localOrg.website" placeholder="Website (optional)" type="url" class="flex-1">
              </div>

              <div class="flex flex-col gap-2">
                <label for="encryption-mode" class="text-caption">Encryption key</label>
                <select id="encryption-mode" v-model="localOrg.encryptionMode">
                  <option value="AUTO">
                    Auto-generate (recommended)
                  </option>
                  <option value="MANUAL">
                    Enter my own password
                  </option>
                </select>

                <input
                  v-if="localOrg.encryptionMode === 'MANUAL'" v-model="localOrg.encryptionKey"
                  placeholder="Organization encryption password (min 12 chars)" type="password"
                  autocomplete="new-password"
                >
              </div>

              <button type="submit" class="btn-primary w-full" :disabled="!localOrg.name">
                Create Organization
              </button>
            </form>
          </div>
        </div>
      </div>

      <div class="border-b">
        <button type="button" class="group flex w-full items-center justify-between p-4 font-semibold transition-colors hover:text-primary" @click="activeSection = activeSection === 'invite' ? null : 'invite'">
          <h5>
            Accept Invitation
          </h5>
          <icon name="ph:caret-down-bold" size="20" class="shrink-0 text-muted-foreground transition-transform group-hover:text-primary" :class="activeSection === 'invite' ? 'rotate-180' : 'rotate-0'" />
        </button>

        <div class="accordion" :class="{ 'accordion--open': activeSection === 'invite' }">
          <div class="accordion-panel">
            <form class="flex flex-col gap-2 p-2" @submit.prevent="handleAcceptInvite">
              <input v-model="token" placeholder="Invite Token" type="text">
              <button type="submit" class="btn-primary w-full" :disabled="!token">
                Accept Invite
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const route = useRoute()
const userStore = useUserStore()
const orgStore = useOrgStore()
const localOrg = ref({ name: "", description: "", website: "", encryptionMode: "AUTO" as "AUTO" | "MANUAL", encryptionKey: "" })
const token = ref(route.query.token as string)
const orgId = ref(route.query.org as string)
const activeSection = ref<"create" | "invite" | null>(route.query.token ? "invite" : "create")

async function handleCreateOrg() {
  if (localOrg.value.encryptionMode === "MANUAL" && localOrg.value.encryptionKey.trim().length < 12) {
    return
  }

  const org = await orgStore.createOrg(localOrg.value)
  if (!org) {
    return
  }

  orgStore.setActiveOrg(org.id)
  setTimeout(navigateTo, 2000, "/admin/organization")
}

async function handleAcceptInvite() {
  const res = await orgStore.acceptInvite(orgId.value, { token: token.value })
  if (res) {
    setTimeout(navigateTo, 2000, "/admin/organization")
  }
}

onMounted(async () => {
  await userStore.getUser()
  localOrg.value.name = userStore.user?.name ? `${userStore.user.name}'s Team` : "My Team"
})

useHead({
  title: "Onboarding",
  link: [{ rel: "canonical", href: `${baseURL}/onboarding` }],
  meta: [{ name: "description", content: "Get started with WindKeep by creating an organization or accepting an invitation." }],
})

definePageMeta({ middleware: "auth" })
</script>

<style scoped>
.onboarding-panel {
  animation: onboarding-enter var(--duration-slow) var(--ease-emphasized) both;
}

@keyframes onboarding-enter {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.accordion {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-base) var(--ease-standard);
}
.accordion--open {
  grid-template-rows: 1fr;
}
.accordion-panel {
  min-height: 0;
  overflow: hidden;
}
</style>
