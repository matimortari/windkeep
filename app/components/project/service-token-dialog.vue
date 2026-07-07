<template>
  <Dialog :is-open="isOpen" title="Generate Service Token" @update:is-open="emit('update:isOpen', $event)">
    <template v-if="generatedRawToken">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <p class="text-sm font-semibold text-success">
            Token generated successfully
          </p>
          <p class="text-xs text-muted-foreground">
            Copy this token now. <strong>You will not be able to see it again.</strong>
          </p>
        </div>

        <div class="navigation-group rounded-sm border bg-muted p-4 font-mono text-xs break-all">
          <span class="flex-1">{{ generatedRawToken }}</span>
          <button type="button" class="btn shrink-0" aria-label="Copy token" @click="copyToken">
            <icon :name="tokenCopyIcon.icon.value" size="20" />
          </button>
        </div>

        <footer class="flex justify-end">
          <button type="button" class="btn-success" @click="handleDismiss">
            I've saved this token securely
          </button>
        </footer>
      </div>
    </template>

    <form v-else class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <div class="flex flex-col items-start gap-1">
        <label for="token-name" class="text-sm font-semibold">Name</label>
        <input id="token-name" v-model="form.name" type="text" placeholder="e.g. GitHub Actions, Vercel Deploy">
        <span class="text-xs text-muted-foreground">A descriptive name to identify this token.</span>
      </div>

      <div class="flex flex-col items-start gap-1">
        <span class="text-sm font-semibold">Environments</span>
        <span class="text-xs text-muted-foreground">Token will only be able to read secrets from selected environments.</span>
        <div class="navigation-group flex-wrap">
          <button
            v-for="env in ENVIRONMENTS" :key="env.value"
            type="button" class="btn-ghost"
            :class="form.environments.includes(env.value) ? 'border-secondary! text-secondary!' : ''" @click="toggleEnvironment(env.value)"
          >
            {{ env.label }}
          </button>
        </div>
      </div>

      <div class="flex flex-col items-start gap-1">
        <label for="token-expiry" class="text-sm font-semibold">Expires in (days)</label>
        <input
          id="token-expiry" v-model.number="form.expiresInDays"
          type="number" min="1"
          max="365" placeholder="Leave empty for no expiration"
          class="w-full"
        >
        <span class="text-xs text-muted-foreground">Optional. Maximum 365 days.</span>
      </div>

      <footer class="flex flex-row items-center justify-end">
        <nav class="navigation-group">
          <button type="button" class="btn-ghost" @click="emit('update:isOpen', false)">
            Cancel
          </button>
          <button class="btn-success" type="submit" :disabled="!canSubmit">
            <icon name="ph:key-bold" size="20" />
            <span>Generate</span>
          </button>
        </nav>
      </footer>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  projectId: string
}>()

const emit = defineEmits<{
  "update:isOpen": [value: boolean]
  "created": []
}>()

const projectStore = useProjectStore()
const { createActionHandler } = useActionIcon()
const tokenCopyIcon = createActionHandler("ph:copy-bold")
const generatedRawToken = ref("")
const form = ref<{ name: string, environments: Environment[], expiresInDays: number | null }>({
  name: "",
  environments: [],
  expiresInDays: null,
})

const canSubmit = computed(() => form.value.name.trim().length >= 3 && form.value.environments.length > 0)

function toggleEnvironment(env: Environment) {
  const idx = form.value.environments.indexOf(env)
  if (idx === -1) {
    form.value.environments.push(env)
  }
  else {
    form.value.environments.splice(idx, 1)
  }
}

function resetForm() {
  form.value = { name: "", environments: [], expiresInDays: null }
  generatedRawToken.value = ""
}

async function copyToken() {
  await tokenCopyIcon.triggerCopy(generatedRawToken.value)
}

function handleDismiss() {
  resetForm()
  emit("created")
  emit("update:isOpen", false)
}

async function handleSubmit() {
  if (!props.projectId || !canSubmit.value) {
    return
  }

  const daysValue = form.value.expiresInDays
  const res = await projectStore.createProjectServiceToken(props.projectId, {
    name: form.value.name.trim(),
    environment: form.value.environments.map(env => env.toUpperCase() as Environment),
    expiresInDays: daysValue && Number(daysValue) > 0 ? Number(daysValue) : undefined,
  })

  if (res?.rawToken) {
    generatedRawToken.value = res.rawToken
  }
}

watch(() => props.isOpen, (open) => {
  if (open) {
    resetForm()
  }
}, { immediate: true })
</script>
