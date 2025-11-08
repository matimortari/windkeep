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
          <option v-for="env in ['DEVELOPMENT', 'STAGING', 'PRODUCTION']" :key="env" :value="env" class="capitalize">
            {{ env }}
          </option>
        </select>
        <span class="text-muted-foreground text-xs">
          Select the environment for the imported secrets.
        </span>
      </div>

      <footer class="flex flex-row items-center justify-between">
        <p class="text-danger">
          {{ validationError || errors.createProjectSecret || " " }}
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

const { errors } = useProjectActions()

const envContent = ref("")
const selectedEnv = ref<Environment>("DEVELOPMENT")
const validationError = ref<string | null>(null)

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

function normalizeKey(key: string): string {
  return key
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
}

function handleSubmit() {
  validationError.value = null

  const parsed = parseEnv(envContent.value)
  if (!Object.entries(parsed).length) {
    validationError.value = "No valid key-value pairs found."
    return
  }

  // Normalize keys to match backend requirements
  const normalizedParsed: Record<string, string> = {}
  for (const [key, value] of Object.entries(parsed)) {
    const normalizedKey = normalizeKey(key)
    if (normalizedKey) {
      normalizedParsed[normalizedKey] = value
    }
  }

  const duplicateKeys: string[] = []
  for (const [key] of Object.entries(normalizedParsed)) {
    const existing = props.secrets.find(secret => secret.key === key)
    if (existing?.values?.some(v => v.environment === selectedEnv.value)) {
      duplicateKeys.push(key)
    }
  }
  if (duplicateKeys.length > 0) {
    validationError.value = `The following keys already exist: ${duplicateKeys.join(", ")}`
    return
  }

  const payload = Object.entries(normalizedParsed).map(([key, value]) => {
    const secretId = crypto.randomUUID()
    return {
      id: secretId,
      key,
      projectId: props.projectId,
      createdAt: new Date(),
      updatedAt: new Date(),
      values: [
        {
          id: crypto.randomUUID(),
          secretId,
          environment: selectedEnv.value,
          value,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    } as Secret
  })

  emit("save", payload)
  emit("close")
}

watch(() => props.isOpen, (open) => {
  if (open) {
    envContent.value = ""
    selectedEnv.value = "DEVELOPMENT"
    validationError.value = null
  }
})
</script>
