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
        <span class="text-xs text-muted-foreground">Select the environment for the imported secrets.</span>
      </div>

      <footer class="flex flex-row items-center justify-between">
        <p class="text-caption-danger">
          {{ errors.createProjectSecret || " " }}
        </p>

        <div class="navigation-group">
          <button class="btn-ghost" aria-label="Cancel" @click="emit('close')">
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
  close: []
  save: [secrets: { key: string, description: string, projectId: string, values: { environment: Environment, value: string }[] }[]]
}>()

const { errors } = storeToRefs(useProjectStore())
const envContent = ref("")
const environments: Environment[] = ["DEVELOPMENT", "STAGING", "PRODUCTION"]
const selectedEnv = ref<Environment>("DEVELOPMENT")

function parseEnv(text: string): Record<string, string> {
  const lines = text.split("\n")
  const parsed: Record<string, string> = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (!match) {
      continue
    }

    const key = match && match[1] ? match[1].trim() : ""
    let value = match && match[2] ? match[2].trim() : ""
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    parsed[key] = value
  }

  return parsed
}

function handleSubmit() {
  const normalized = Object.fromEntries(Object.entries(parseEnv(envContent.value)).map(([key, value]) => [normalizeKey(key), value]).filter(([key]) => Boolean(key)))
  const payload = Object.entries(normalized).map(([key, value]) => ({
    key,
    description: "",
    projectId: props.projectId,
    values: [{ environment: selectedEnv.value, value: value as string }],
  }))

  emit("save", payload)
}

// Reset form and clear errors when dialog is opened
watch(() => props.isOpen, (open) => {
  if (open) {
    envContent.value = ""
    selectedEnv.value = "DEVELOPMENT"
    if (errors.value.createProjectSecret) {
      errors.value.createProjectSecret = null
    }
  }
})
</script>
