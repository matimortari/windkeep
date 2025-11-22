<template>
  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1 }" :duration="800">
    <h2 class="border-b py-4">
      Preferences
    </h2>

    <section class="flex flex-col">
      <div class="gap-2 border-b p-4 md:navigation-group">
        <header class="flex flex-col gap-2">
          <h3>
            User Information
          </h3>
          <p class="text-caption">
            Manage your account information.
          </p>
        </header>

        <p v-if="Object.values(errors).some(Boolean)" class="text-danger">
          {{ Object.values(errors).find(Boolean) }}
        </p>
      </div>

      <!-- User Details -->
      <div v-for="(field, index) in userFields" :key="index" class="flex flex-col justify-between gap-2 border-b p-4 md:navigation-group md:px-10">
        <header class="flex flex-col items-start justify-center gap-1 text-start">
          <h5>
            {{ field.label }}
          </h5>
          <p v-if="field.description" class="text-caption">
            {{ field.description }}
          </p>
        </header>

        <div v-if="field.copyable" class="navigation-group justify-end">
          <span>{{ field.value }}</span>
          <button
            class="btn transition-transform" title="Copy to Clipboard"
            aria-label="Copy to Clipboard" @click="copyIcon[index]?.triggerCopy(field.value?.value || '')"
          >
            <icon :name="copyIcon[index]?.icon.value || 'ph:copy'" size="20" />
          </button>
        </div>

        <div v-else-if="field.type === 'input'" class="navigation-group justify-end">
          <input type="text" :value="field.model?.value" @input="field.update?.(($event.target as HTMLInputElement).value)">
          <button class="btn transition-transform" aria-label="Save Changes" @click="field.onSave && field.onSave(index)">
            <icon :name="saveIcon[index]?.icon.value || 'ph:floppy-disk'" size="20" />
          </button>
        </div>

        <div v-else-if="field.type === 'image'" class="navigation-group justify-end">
          <img v-if="field.src" :src="field.src.value ?? undefined" alt="Profile preview" class="size-10 rounded-full border-2">
          <input
            id="image" type="file"
            accept="image/*" class="hidden"
            @change="field.onUpload"
          >
          <label for="image" class="btn">
            <icon name="ph:image" size="20" />
          </label>
        </div>

        <span v-else class="navigation-group justify-end">{{ field.value }}</span>
      </div>
    </section>

    <!-- Danger Zone -->
    <section class="flex flex-col">
      <header class="flex flex-col items-start gap-2 border-b p-4 text-start">
        <h3>
          Danger Zone
        </h3>
        <p class="text-caption">
          This section contains actions that can significantly affect your account. Please proceed with caution.
        </p>
      </header>

      <nav class="flex flex-col justify-between gap-2 border-b p-4 md:navigation-group md:px-10" aria-label="Delete Account">
        <header class="flex flex-col gap-1">
          <h5>
            Delete Account
          </h5>
          <p class="text-danger">
            This action is irreversible. All your data will be permanently deleted.
          </p>
        </header>

        <div class="navigation-group self-end">
          <p v-if="errors.deleteUser" class="text-danger">
            {{ errors.deleteUser }}
          </p>

          <button class="btn-danger" aria-label="Delete Account" @click="handleDeleteUser">
            <icon name="ph:user-minus" size="20" />
            <span>Confirm</span>
          </button>
        </div>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
const { createActionHandler } = useActionIcon()
const { user, activeOrg, updateProfile, updateProfileImage, deleteAccount, errors } = useUserActions()

const userFields = [
  {
    label: "User Name",
    description: "This name will be displayed in your account and projects.",
    type: "input",
    model: computed(() => user.value?.name),
    update: (value: string) => {
      if (user.value)
        user.value.name = value
    },
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
    label: "Active Organization",
    description: "The organization you are currently working in.",
    value: computed(() => activeOrg.value?.name || "N/A"),
  },
  {
    label: "Active Organization Role",
    description: "Your role within the active organization.",
    value: computed(() => {
      const membership = user.value?.orgMemberships?.find(m => m.orgId === user.value?.activeOrgId)
      return capitalizeFirst(membership?.role || "N/A")
    }),
  },
  {
    label: "Joined On",
    description: "The date you joined SecretkeepR.",
    value: computed(() => formatDate(user.value?.createdAt ? new Date(user.value.createdAt) : undefined)),
  },
  {
    label: "CLI Token",
    description: "This token is used for CLI access. Keep it secret and secure.",
    value: computed(() => user.value?.apiToken),
    copyable: true,
  },
  {
    label: "Profile Image",
    description: "Supported formats: JPG, PNG. Maximum size: 5MB.",
    type: "image",
    src: computed(() => user.value?.image),
    onUpload: handleUpdateImage,
  },
]

const copyIcon = userFields.map(() => createActionHandler("ph:copy"))
const saveIcon = userFields.map(() => createActionHandler("ph:floppy-disk"))

async function handleUpdateImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input?.files?.[0]
  if (!file)
    return

  const res = await updateProfileImage(file)
  if (res?.imageUrl && user.value) {
    user.value.image = res.imageUrl
  }
}

async function handleSubmit(index: number) {
  if (!user.value?.id || !user.value?.name)
    return

  await updateProfile({
    name: user.value.name,
  })
  saveIcon[index]?.triggerSuccess()
}

async function handleDeleteUser() {
  if (!confirm("Are you sure you want to delete your account? This action cannot be undone."))
    return

  await deleteAccount()
}

useHead({
  title: "Preferences",
  link: [{ rel: "canonical", href: "https://secretkeepr.vercel.app/admin/preferences" }],
  meta: [{ name: "description", content: "SecretkeepR preferences page." }],
})

definePageMeta({
  layout: "admin",
  middleware: auth,
})
</script>
