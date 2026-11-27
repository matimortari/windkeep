<template>
  <Dialog :is-open="isOpen" title="Create Integration Secrets" @update:is-open="emit('update:isOpen', $event)">
    <form class="flex flex-col gap-4 md:w-xl" @submit.prevent="handleSubmit">
      <div class="flex flex-col items-start gap-1">
        <span class="text-sm font-semibold">Environments</span>
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

      <div class="flex flex-col gap-1">
        <span class="text-sm font-semibold">Secrets</span>
        <ul class="divide-y rounded-md border bg-muted/30">
          <li v-for="row in rows" :key="row.name" class="flex min-h-11 items-center gap-2 p-2 transition-opacity" :class="row.included ? '' : 'opacity-50'">
            <button
              type="button" class="flex w-52 shrink-0 items-center gap-2 text-left disabled:cursor-not-allowed"
              :disabled="row.exists" :aria-pressed="row.included"
              @click="row.included = !row.included"
            >
              <icon :name="row.included ? 'ph:check-square-fill' : 'ph:square-bold'" size="15" class="shrink-0" :class="row.included ? 'text-secondary' : 'text-muted-foreground'" />
              <span class="truncate font-mono text-sm font-medium" :title="row.name">{{ row.name }}</span>
            </button>

            <span v-if="row.exists" class="text-caption">Already in project</span>
            <span v-else-if="row.source" class="text-caption min-w-0 truncate" :class="row.source === 'projectId' ? 'font-mono!' : ''" :title="autoValueLabel(row)">
              {{ autoValueLabel(row) }}
            </span>
            <input
              v-else v-model="row.value"
              type="text" class="h-8 min-w-0 flex-1 py-1! font-mono text-sm placeholder:font-sans"
              :disabled="!row.included" :placeholder="row.placeholder"
              :aria-label="`${row.name} value`"
            >
          </li>
        </ul>
        <span class="text-xs text-muted-foreground">Empty values are saved as placeholders you can edit later.</span>
      </div>

      <div v-if="includesToken" class="grid grid-cols-1 gap-2 md:grid-cols-[1fr_10rem]">
        <div class="flex flex-col gap-1">
          <label for="integration-token-name" class="text-sm font-semibold">Token name</label>
          <input id="integration-token-name" v-model="form.tokenName" type="text" placeholder="e.g. Railway Deploy">
        </div>
        <div class="flex flex-col gap-1">
          <label for="integration-token-expiry" class="text-sm font-semibold">Expires (days)</label>
          <input
            id="integration-token-expiry" v-model.number="form.expiresInDays"
            type="number" min="1"
            max="365" placeholder="Never"
          >
        </div>
      </div>

      <footer class="flex flex-row items-center justify-end">
        <nav class="navigation-group">
          <button type="button" class="btn-ghost" @click="emit('update:isOpen', false)">
            Cancel
          </button>
          <button type="submit" class="btn-success" :disabled="!canSubmit || isSubmitting">
            <icon :name="isSubmitting ? 'ph:circle-notch-bold' : 'ph:plus-bold'" size="20" :class="isSubmitting ? 'animate-spin' : ''" />
            <span>Create</span>
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
  integration: IntegrationDefinition | null
}>()

const emit = defineEmits<{
  "update:isOpen": [value: boolean]
  "tokenCreated": [rawToken: string]
}>()

const secretsStore = useSecretsStore()
const projectStore = useProjectStore()
const isSubmitting = computed(() => projectStore.loading || secretsStore.loading)
const rows = ref<{ name: string, description: string, placeholder?: string, source?: IntegrationSecretVar["source"], value: string, included: boolean, exists: boolean }[]>([])
const form = ref<{ environments: Environment[], tokenName: string, expiresInDays: number | null }>({ environments: [], tokenName: "", expiresInDays: null })
const selectedRows = computed(() => rows.value.filter(row => row.included && !row.exists))
const includesToken = computed(() => selectedRows.value.some(row => row.source === "serviceToken"))
const canSubmit = computed(() => form.value.environments.length > 0 && selectedRows.value.length > 0 && (!includesToken.value || form.value.tokenName.trim().length >= 3))

function toggleEnvironment(env: Environment) {
  const idx = form.value.environments.indexOf(env)
  if (idx === -1) {
    form.value.environments.push(env)
  }
  else {
    form.value.environments.splice(idx, 1)
  }
}

function autoValueLabel(row: typeof rows.value[number]) {
  if (row.source === "serviceToken") {
    return "Generated on create"
  }
  if (row.source === "environment") {
    return form.value.environments.join(", ") || "Select an environment"
  }
  return row.value
}

async function resetForm() {
  const integration = props.integration
  form.value = {
    environments: [...(integration?.defaultEnvironments ?? ["PRODUCTION"])],
    tokenName: integration?.defaultTokenName ?? integration?.name ?? "",
    expiresInDays: null,
  }
  rows.value = (integration?.secrets ?? []).map(secret => ({
    name: secret.name,
    description: secret.description,
    placeholder: secret.placeholder,
    source: secret.source,
    value: secret.source === "projectId" ? props.projectId : "",
    included: true,
    exists: false,
  }))

  const existingKeys = new Set((await secretsStore.getProjectSecrets(props.projectId)).map(secret => secret.key))
  for (const row of rows.value) {
    row.exists = existingKeys.has(row.name)
    row.included = !row.exists
  }
}

async function handleSubmit() {
  if (!props.projectId || !canSubmit.value) {
    return
  }

  const environments = [...form.value.environments]
  let rawToken = ""

  if (includesToken.value) {
    const days = form.value.expiresInDays
    const res = await projectStore.createProjectServiceToken(props.projectId, { name: form.value.tokenName.trim(), environment: environments, expiresInDays: days && Number(days) > 0 ? Number(days) : undefined })
    rawToken = res.rawToken
    emit("tokenCreated", rawToken)
  }

  const valueFor = (row: typeof rows.value[number], env: Environment) => {
    if (row.source === "serviceToken") {
      return rawToken
    }
    if (row.source === "environment") {
      return env
    }
    return row.value.trim() || `<${row.name}>`
  }

  await secretsStore.createProjectSecrets(props.projectId, selectedRows.value.map(row => ({
    key: row.name,
    description: row.description,
    tags: [],
    projectId: props.projectId,
    values: environments.map(env => ({ environment: env, value: valueFor(row, env) })),
  })))
  emit("update:isOpen", false)
}

// Reset the form and reload existing keys every time the dialog opens
watch(() => props.isOpen, (open) => {
  if (open) {
    resetForm()
  }
}, { immediate: true })
</script>
