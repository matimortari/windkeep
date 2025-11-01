<template>
  <div class="flex w-full flex-col items-center justify-center">
    <header
      v-motion class="flex flex-col items-center gap-4 border-b-2 p-4 text-center"
      :initial="{ opacity: 0, y: -10, scale: 0.8 }" :visible="{ opacity: 1, y: 0, scale: 1 }"
      :duration="800"
    >
      <h1>
        Welcome to SecretkeepR
      </h1>
      <p class="text-caption">
        To get started, please create an organization name with at least 2 characters.
      </p>
    </header>

    <form
      v-motion class="flex min-w-lg flex-col items-center gap-2 p-4"
      :initial="{ opacity: 0 }" :visible="{ opacity: 1 }"
      :duration="800" @submit.prevent="handleCreateOrg"
    >
      <input
        v-model="localOrg.name" placeholder="Organization Name"
        class="w-full" type="text"
        autofocus
      >
      <button class="btn-primary w-full" type="submit" aria-label="Create Organization">
        Create Organization
      </button>
    </form>

    <p class="text-caption flex min-h-4 flex-col items-center gap-2">
      <span v-if="errors.createOrg" class="text-danger-foreground">{{ errors.createOrg }}</span>

      <span> Already have an invite? <nuxt-link to="/onboarding/join-org" class="text-primary hover:underline">
        Join an Organization
      </nuxt-link>.
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { createOrganizationSchema } from "#shared/lib/schemas/org"

const { user, fetchUser } = useUserActions()
const { createOrganization, errors } = useOrganizationActions()

const localOrg = ref({
  name: `${user.value?.name || user.value?.email}'s Organization`,
})

async function handleCreateOrg() {
  errors.value.createOrg = null

  const result = createOrganizationSchema.safeParse(localOrg.value)
  if (!result.success) {
    const firstError = result.error.issues[0]
    if (firstError?.path[0] === "name") {
      if (firstError?.code === "too_small") {
        errors.value.createOrg = "Organization name must be at least 2 characters long."
      }
      else if (firstError?.code === "too_big") {
        errors.value.createOrg = "Organization name must be no more than 100 characters long."
      }
    }
    else {
      errors.value.createOrg = firstError?.message ?? "An unknown error occurred."
    }
    return
  }

  try {
    await createOrganization(result.data)
    localOrg.value.name = ""
    navigateTo("/admin/projects")
  }
  catch (err: any) {
    errors.value.createOrg = err.message
  }
}

onMounted(async () => {
  await fetchUser()
  localOrg.value.name = `${user.value?.name || user.value?.email}'s Organization` || "My Organization"
})

useHead({
  title: "Create Organization",
  link: [{ rel: "canonical", href: "https://secretkeepr.vercel.app/onboarding/create-org" }],
  meta: [{ name: "description", content: "Create your organization on SecretkeepR." }],
})

definePageMeta({
  layout: "fullscreen",
  middleware: auth,
})
</script>
