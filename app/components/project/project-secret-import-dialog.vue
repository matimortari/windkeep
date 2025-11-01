<template>
  <Dialog :is-open="isOpen" title="Import from .env" @update:is-open="emit('close')">
    <form class="flex flex-col gap-2" @submit.prevent="handleSubmit">
      <textarea
        v-model="envContent" name="env-content"
        placeholder="Paste your .env content here..."
        rows="8" class="scroll-area resize-none"
      />

      <div class="flex flex-col items-start gap-1">
        <span class="text-sm font-semibold">Environment</span>
        <select v-model="selectedEnv" class="w-full capitalize">
          <option v-for="env in ['development', 'staging', 'production']" :key="env" :value="env" class="capitalize">
            {{ env }}
          </option>
        </select>
        <span class="text-muted-foreground text-xs">
          Select the environment for the imported secrets.
        </span>
      </div>

      <footer class="flex flex-row items-center justify-between">
        <p class="text-warning">
          {{ projectStore.errors.createProjectSecret || " " }}
        </p>

        <div class="navigation-group">
          <button class="text-sm font-semibold hover:underline" aria-label="Cancel" @click="emit('close')">
            Cancel
          </button>
          <button class="btn-success" type="submit" aria-label="Import Secrets from .env File">
            Import
          </button>
        </div>
      </footer>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  projectId: string
  secrets: Secret[]
}>()

const emit = defineEmits<{
  (e: "close"): void
  (e: "save", secrets: Secret[]): void
}>()

const projectStore = useProjectStore()

const envContent = ref("")
const selectedEnv = ref<Environment>("development")

function parseEnv(text: string): Record<string, string> {
  const lines = text.split("\n")
  const parsed: Record<string, string> = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#"))
      continue

    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (!match)
      continue

    const key = match && match[1] ? match[1].trim() : ""
    let value = match && match[2] ? match[2].trim() : ""
    if (
      (value.startsWith("\"") && value.endsWith("\""))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    parsed[key] = value
  }

  return parsed
}

function handleSubmit() {
  projectStore.errors.createProjectSecret = null

  const parsed = parseEnv(envContent.value)
  if (!Object.entries(parsed).length) {
    projectStore.errors.createProjectSecret = "No valid key-value pairs found."
    return
  }

  const duplicateKeys: string[] = []
  for (const [key] of Object.entries(parsed)) {
    const existing = props.secrets.find(secret => secret.key === key)
    if (existing?.values?.some(v => v.environment === selectedEnv.value)) {
      duplicateKeys.push(key)
    }
  }
  if (duplicateKeys.length > 0) {
    projectStore.errors.createProjectSecret = `The following keys already exist: ${duplicateKeys.join(", ")}`
    return
  }

  const payload: Secret[] = Object.entries(parsed).map(([key, value]) => {
    const secretId = crypto.randomUUID()
    return {
      id: secretId,
      key,
      projectId: props.projectId,
      values: [
        {
          id: crypto.randomUUID(),
          secretId,
          environment: selectedEnv.value,
          value,
        },
      ],
    }
  })

  emit("save", payload)
  emit("close")
}

watch(() => props.isOpen, (open) => {
  if (open) {
    envContent.value = ""
    selectedEnv.value = "development"
    projectStore.errors.createProjectSecret = null
  }
})
</script>
