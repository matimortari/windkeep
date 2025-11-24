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
          <option v-for="env in environments" :key="env" :value="env" class="capitalize">
            {{ capitalizeFirst(env) }}
          </option>
        </select>
        <span class="text-xs text-muted-foreground">
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
import type { CreateSecretInput } from "#shared/schemas/secret-schema"
import { createSecretSchema } from "#shared/schemas/secret-schema"

const props = defineProps<{
  isOpen: boolean
  projectId: string
  secrets: Secret[]
}>()

const emit = defineEmits<{
  (e: "close"): void
  (e: "save", secrets: CreateSecretInput[]): void
}>()

const { errors } = storeToRefs(useProjectStore())

const environments: Environment[] = ["DEVELOPMENT", "STAGING", "PRODUCTION"]

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

function handleSubmit() {
  validationError.value = null

  const parsed = parseEnv(envContent.value)
  if (!Object.keys(parsed).length) {
    validationError.value = "No valid key-value pairs found."
    return
  }

  const normalized = Object.fromEntries(
    Object.entries(parsed)
      .map(([key, value]) => [normalizeKey(key), value])
      .filter(([key]) => Boolean(key)),
  )

  const duplicates = Object.keys(normalized).filter((key) => {
    const existing = props.secrets.find(s => s.key === key)
    return existing?.values?.some(v => v.environment === selectedEnv.value)
  })

  if (duplicates.length) {
    validationError.value = `The following keys already exist: ${duplicates.join(", ")}`
    return
  }

  const payload = Object.entries(normalized).map(([key, value]) =>
    createSecretSchema.parse({
      key,
      description: "",
      projectId: props.projectId,
      values: [
        {
          environment: selectedEnv.value,
          value,
        },
      ],
    }),
  )

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
