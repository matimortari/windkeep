<template>
  <div
    v-motion :initial="{ opacity: 0 }"
    :enter="{ opacity: 1 }" :duration="800"
    class="container mx-auto"
  >
    <h2 class="border-b py-2">
      Preferences
    </h2>

    <TabSection title="Preferences" description="Manage your account information.">
      <div v-for="(field, index) in userFields" :key="index" class="flex flex-col justify-between gap-4 border-b py-2 last:border-b-0 md:navigation-group">
        <header class="flex flex-col items-start justify-center gap-1 text-start">
          <h6>
            {{ field.label }}
          </h6>
          <p v-if="field.description" class="text-caption">
            {{ field.description }}
          </p>
        </header>

        <div v-if="field.copyable" class="navigation-group justify-end">
          <p v-if="field.label === 'CLI Token'">
            <span v-if="!field.hasToken?.value" class="text-caption px-4">No Active Token</span>
            <span v-else-if="isTokenExpired(field.expiresAt?.value)" class="text-caption-danger px-4">Expired</span>
            <span v-else class="text-caption px-4">Expires {{ formatDate(field.expiresAt?.value) }}</span>
          </p>

          <span :class="{ 'text-caption-success font-mono!': field.label === 'CLI Token' && generatedToken }">{{ field.value?.value }}</span>

          <button class="btn" :aria-label="`Copy ${field.label} to Clipboard`" @click="copyIcon[index]?.triggerCopy(field.value?.value || '')">
            <icon :name="copyIcon[index]?.icon.value || 'ph:copy-bold'" size="20" />
          </button>

          <button v-if="field.onRegenerate" class="btn" aria-label="Regenerate API Token" @click="field.onRegenerate()">
            <icon :name="regenerateIcon[index]?.icon.value || 'ph:arrows-clockwise-bold'" size="20" />
          </button>
        </div>

        <div v-else-if="field.type === 'input'" class="navigation-group justify-end">
          <input type="text" :value="field.model?.value" @input="field.update?.(($event.target as HTMLInputElement).value)">
          <button class="btn" aria-label="Save Changes" @click="field.onSave && field.onSave(index)">
            <icon :name="saveIcon[index]?.icon.value || 'ph:floppy-disk-bold'" size="20" />
          </button>
        </div>

        <div v-else-if="field.type === 'image'" class="navigation-group justify-end">
          <img v-if="field.src" :src="field.src.value ?? undefined" alt="Profile preview" class="size-16 rounded-full border">
          <input
            id="image" type="file"
            accept="image/*" class="hidden"
            @change="field.onUpload"
          >
          <label class="btn cursor-pointer" for="image" aria-label="Upload Profile Image">
            <icon name="ph:image-bold" size="20" />
          </label>
        </div>

        <span v-else class="navigation-group justify-end">{{ field.value }}</span>
      </div>

      <div class="flex flex-col gap-4 border-t pt-6">
        <p class="section-label">
          Danger Zone
        </p>

        <nav class="flex flex-col justify-between gap-4 md:navigation-group" aria-label="Delete Account">
          <header class="flex flex-col gap-1">
            <h6>
              Delete Account
            </h6>
            <p class="text-caption-danger">
              This action is irreversible. All your data will be permanently deleted.
            </p>
          </header>

          <button class="btn-danger self-end" aria-label="Delete Account" @click="handleDeleteUser">
            <icon name="ph:user-minus-bold" size="20" />
            <span>Confirm</span>
          </button>
        </nav>
      </div>
    </TabSection>
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const { clear } = useUserSession()
const { createActionHandler } = useActionIcon()
const userStore = useUserStore()
const { user, tokenMetadata } = storeToRefs(userStore)
const { activeOrg } = storeToRefs(useOrgStore())
const generatedToken = ref("")

const userFields = [
  {
    label: "User Name",
    description: "This name will be displayed in your account and projects.",
    type: "input",
    model: computed(() => user.value?.name),
    update: (value: string) => { user.value!.name = value },
    onSave: handleSubmit,
  },
  {
    label: "User ID",
    description: "This ID is unique to your account and cannot be changed.",
    value: computed(() => user.value?.id),
    copyable: true,
  },
  {
    label: "User Email",
    description: "Your registered email address.",
    value: computed(() => user.value?.email),
  },
  {
    label: "Current Organization",
    description: "The organization you are currently working in.",
    value: computed(() => activeOrg.value?.name || "N/A"),
  },
  {
    label: "Current Organization Role",
    description: "Your role within the current organization.",
    value: computed(() => ROLES.find(role => role.value === activeOrg.value?.memberships?.find(m => m.userId === user.value?.id)?.role)?.label || "N/A"),
  },
  {
    label: "Joined On",
    description: "The date you joined WindKeep.",
    value: computed(() => formatDate(user.value?.createdAt)),
  },
  {
    label: "CLI Token",
    description: "Use this token to login to the WindKeep CLI. Keep it secure and do not share it.",
    value: computed(() => {
      if (generatedToken.value) {
        return generatedToken.value
      }
      return tokenMetadata.value?.hasToken ? "••••••••••••••••••••••••••••••••" : "No active token generated"
    }),
    expiresAt: computed(() => tokenMetadata.value?.expiresAt),
    hasToken: computed(() => tokenMetadata.value?.hasToken),
    onRegenerate: handleRegenerateToken,
    copyable: true,
  },
  {
    label: "Profile Image",
    description: "Supported formats: JPG, PNG. Maximum size: 2MB.",
    type: "image",
    src: computed(() => user.value?.image),
    onUpload: handleUpdateImage,
  },
]

const copyIcon = userFields.map(() => createActionHandler("ph:copy-bold"))
const saveIcon = userFields.map(() => createActionHandler("ph:floppy-disk-bold"))
const regenerateIcon = userFields.map(() => createActionHandler("ph:arrows-clockwise-bold"))

function isTokenExpired(expiresAt: string | Date | null | undefined): boolean {
  if (!expiresAt) {
    return false
  }

  return new Date(expiresAt) < new Date()
}

async function handleUpdateImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input?.files?.[0]
  if (!file) {
    return
  }

  const res = await userStore.updateUserImage(file)
  if (res?.imageUrl && user.value) {
    user.value.image = res.imageUrl
  }
}

async function handleRegenerateToken() {
  if (tokenMetadata.value?.hasToken) {
    if (!confirm("Regenerating your token will instantly revoke CLI access using the current token. Are you sure you want to proceed?")) {
      return
    }
  }

  const res = await userStore.generateApiToken()
  if (res?.rawToken) {
    generatedToken.value = res.rawToken
    const cliTokenIndex = userFields.findIndex(f => f.label === "CLI Token")
    if (cliTokenIndex !== -1) {
      regenerateIcon[cliTokenIndex]?.triggerSuccess()
    }
  }
}

async function handleSubmit(index: number) {
  if (!user.value?.id || !user.value?.name) {
    return
  }

  await userStore.updateUser({ name: user.value.name })
  saveIcon[index]?.triggerSuccess()
}

async function handleDeleteUser() {
  if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
    return
  }

  await userStore.deleteUser()
  await clear()
  await navigateTo("/sign-in", { replace: true })
}

onMounted(async () => await userStore.getTokenMetadata())

useHead({
  title: "Preferences",
  link: [{ rel: "canonical", href: `${baseURL}/admin/preferences` }],
  meta: [{ name: "description", content: "WindKeep preferences page." }],
})

definePageMeta({ layout: "admin", middleware: "auth" })
</script>
