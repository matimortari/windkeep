<template>
  <TabSection title="Settings">
    <template #context>
      <h3 class="flex max-w-lg flex-row items-center gap-1 truncate text-muted-foreground">
        <span class="truncate">{{ activeOrg?.name }}</span>
        <nuxt-link v-if="activeOrg?.website" :href="activeOrg.website" target="_blank" aria-label="Visit organization website">
          <icon name="ph:arrow-up-right-bold" size="15" class="hover:text-primary" />
        </nuxt-link>
      </h3>
    </template>

    <div class="flex flex-col">
      <div v-for="(field, index) in orgFields" :key="index" class="flex flex-col justify-between gap-4 border-b py-4 last:border-b-0 md:navigation-group">
        <div class="flex flex-col items-start justify-center gap-1 text-start">
          <h6>
            {{ field.label }}
          </h6>
          <p v-if="field.description" class="text-caption">
            {{ field.description }}
          </p>
        </div>

        <div v-if="field.copyable" class="navigation-group justify-end">
          <span>{{ field.value }}</span>
          <button class="btn transition-transform" :aria-label="`Copy ${field.label} to Clipboard`" @click="copyIcon[index]?.triggerCopy(field.value?.value || '')">
            <icon :name="copyIcon[index]?.icon.value || 'ph:copy-bold'" size="20" />
          </button>
        </div>

        <div v-else-if="field.type === 'input' && field.editable" class="navigation-group justify-end">
          <input type="text" :value="field.model?.value" @input="field.update?.(($event.target as HTMLInputElement).value)">
          <button class="btn transition-transform" aria-label="Save Changes" @click="field.onSave(index)">
            <icon :name="saveIcon[index]?.icon.value || 'ph:floppy-disk-bold'" size="20" />
          </button>
        </div>

        <span v-else-if="field.type === 'input'" class="navigation-group justify-end">{{ field.model?.value }}</span>

        <span v-else class="navigation-group justify-end">{{ field.value }}</span>
      </div>
    </div>

    <div v-if="isOwner" class="flex flex-col justify-between gap-4 border-t py-4 md:navigation-group" aria-label="Organization encryption settings">
      <header class="flex flex-col gap-1">
        <h6>
          Rotate Organization Encryption Key
        </h6>
        <p class="text-caption">
          Existing secrets are re-encrypted automatically.
        </p>
      </header>

      <div class="navigation-group justify-end" :class="encryptionMode === 'MANUAL' ? 'flex-wrap md:flex-nowrap' : ''">
        <select v-model="encryptionMode" class="w-full md:max-w-52">
          <option value="AUTO">
            Auto-generate (recommended)
          </option>
          <option value="MANUAL">
            Enter my own password
          </option>
        </select>

        <div class="navigation-group">
          <input
            v-if="encryptionMode === 'MANUAL'" v-model="manualEncryptionKey"
            type="password" autocomplete="new-password"
            placeholder="New encryption password (min 12 chars)"
          >
          <button class="btn-warning" aria-label="Rotate Organization Encryption Key" :disabled="!canRotateEncryptionKey" @click="handleRotateEncryptionKey">
            <icon :name="rotateKeyIcon.icon.value || 'ph:key-bold'" size="20" />
            <span>Rotate Key</span>
          </button>
        </div>
      </div>
    </div>
  </TabSection>

  <TabSection title="Danger Zone">
    <nav class="flex flex-col justify-between gap-4 border-b py-4 md:navigation-group" aria-label="Leave Organization">
      <header class="flex flex-col gap-1">
        <h6>
          Leave Organization
        </h6>
        <p class="text-caption-danger">
          This action is irreversible. You will no longer have access to this organization. If you are the last owner, the organization will be deleted.
        </p>
      </header>

      <button class="btn-danger self-end" aria-label="Leave Organization" @click="handleLeaveOrg">
        <icon name="ph:sign-out-bold" size="20" />
        <span>Confirm</span>
      </button>
    </nav>

    <nav v-if="isOwner" class="flex flex-col justify-between gap-4 py-4 md:navigation-group" aria-label="Delete Organization">
      <header class="flex flex-col gap-1">
        <h6>
          Delete Organization
        </h6>
        <p class="text-caption-danger">
          This action is irreversible. All data associated with this organization will be permanently deleted.
        </p>
      </header>

      <button class="btn-danger self-end" aria-label="Delete Organization" @click="handleDeleteOrg">
        <icon name="ph:network-x-bold" size="20" />
        <span>Confirm</span>
      </button>
    </nav>
  </TabSection>
</template>

<script setup lang="ts">
const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const orgStore = useOrgStore()
const { activeOrg, isOwner } = storeToRefs(orgStore)
const encryptionMode = ref<"AUTO" | "MANUAL">("AUTO")
const manualEncryptionKey = ref("")

const orgFields = [
  {
    label: "Organization Name",
    description: "The name of your organization.",
    type: "input",
    model: computed(() => activeOrg.value?.name),
    update: (value: string) => { activeOrg.value!.name = value },
    onSave: handleSubmit,
    editable: isOwner,
  },
  {
    label: "Organization Description",
    description: "A brief description of your organization.",
    type: "input",
    model: computed(() => activeOrg.value?.description),
    update: (value: string) => { activeOrg.value!.description = value },
    onSave: handleSubmit,
    editable: isOwner,
  },
  {
    label: "Organization Website",
    description: "The website URL for your organization.",
    type: "input",
    model: computed(() => activeOrg.value?.website),
    update: (value: string) => { activeOrg.value!.website = value },
    onSave: handleSubmit,
    editable: isOwner,
  },
  {
    label: "Organization ID",
    description: "This ID uniquely identifies your organization.",
    value: computed(() => activeOrg.value?.id),
    copyable: true,
  },
  {
    label: "Created At",
    description: "When your organization was created.",
    value: computed(() => formatDate(activeOrg.value?.createdAt)),
  },
  {
    label: "Encryption Key Updated At",
    description: "When your organization encryption key was last rotated.",
    value: computed(() => formatDate(activeOrg.value?.encryptionKeyUpdatedAt)),
  },
]

const copyIcon = orgFields.map(() => useActionIcon("ph:copy-bold"))
const saveIcon = orgFields.map(() => useActionIcon("ph:floppy-disk-bold"))
const rotateKeyIcon = useActionIcon("ph:key-bold")
const canRotateEncryptionKey = computed(() => encryptionMode.value === "AUTO" || manualEncryptionKey.value.trim().length >= 12)

async function handleSubmit(index: number) {
  if (!activeOrg.value?.id) {
    return
  }

  await orgStore.updateOrg(activeOrg.value.id, {
    name: activeOrg.value.name,
    description: activeOrg.value.description || undefined,
    website: activeOrg.value.website || undefined,
  })

  await orgStore.getOrg(activeOrg.value.id)
  await userStore.getUser()
  saveIcon[index]?.triggerSuccess()
}

async function handleRotateEncryptionKey() {
  if (!activeOrg.value?.id || !canRotateEncryptionKey.value) {
    return
  }
  if (!confirm("Rotate the organization encryption key now? This will re-encrypt all organization secrets.")) {
    return
  }

  await orgStore.updateOrg(activeOrg.value.id, {
    rotateEncryptionKey: true,
    encryptionMode: encryptionMode.value,
    encryptionKey: encryptionMode.value === "MANUAL" ? manualEncryptionKey.value : undefined,
  })

  manualEncryptionKey.value = ""
  await orgStore.getOrg(activeOrg.value.id)
  rotateKeyIcon.triggerSuccess()
}

async function handleLeaveOrg() {
  if (!activeOrg.value?.id || !user.value?.id) {
    return
  }
  if (!confirm("Are you sure you want to leave this organization? This action cannot be undone.")) {
    return
  }

  await orgStore.removeOrgMember(activeOrg.value.id, user.value.id)
  await navigateTo("/onboarding")
}

async function handleDeleteOrg() {
  if (!activeOrg.value?.id) {
    return
  }
  if (!confirm("Are you sure you want to delete this organization? This action cannot be undone.")) {
    return
  }

  await orgStore.deleteOrg(activeOrg.value.id)
}
</script>
