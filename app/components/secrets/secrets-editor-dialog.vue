<template>
  <Dialog :is-open="isRawEditorOpen" title="Raw .env Editor" @update:is-open="closeDialog('raw')">
    <div class="flex flex-col gap-3">
      <div class="flex flex-row gap-1 rounded-lg border p-1">
        <button
          v-for="env in environments" :key="env"
          class="flex-1 rounded-md px-2 py-1 text-sm font-medium transition-colors" :class="selectedEnv === env ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'"
          @click=" selectedEnv = env; editorContent = buildEnvText(env) "
        >
          {{ capitalizeFirst(env) }}
        </button>
      </div>

      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between">
          <label for="env-content" class="text-sm font-semibold">.env content</label>
          <span class="text-xs text-muted-foreground">{{ capitalizeFirst(selectedEnv) }} environment</span>
        </div>
        <textarea
          id="env-content" v-model="editorContent"
          name="env-content" placeholder="KEY=value&#10;ANOTHER_KEY=another_value"
          rows="10" class="scroll-area resize-none font-mono text-sm"
          spellcheck="false"
        />
      </div>

      <div v-if="hasDiff" class="flex flex-col gap-1 rounded-lg border p-2">
        <span class="text-xs font-semibold text-muted-foreground">Preview</span>
        <ul class="flex flex-col gap-0.5">
          <li
            v-for="item in diffItems" :key="item.key"
            class="navigation-group rounded-sm px-1 py-0.5 font-mono text-xs" :class="item.class"
          >
            <icon :name="item.icon" size="12" />
            <span class="font-semibold">{{ item.key }}</span>
            <span v-if="item.type !== 'removed'" class="truncate text-muted-foreground">= {{ item.value }}</span>
          </li>
        </ul>
      </div>

      <p v-else-if="editorContent.trim() && !hasDiff" class="text-xs text-muted-foreground">
        No changes detected from current state.
      </p>

      <footer class="flex flex-row items-center justify-end">
        <div class="navigation-group">
          <button class="btn-ghost" @click="emit('close')">
            Cancel
          </button>
          <button class="btn-success" :disabled="!hasDiff" @click="handleSubmit">
            Apply Changes
          </button>
        </div>
      </footer>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  projectId: string
  secrets: Secret[]
}>()

const emit = defineEmits<{
  close: []
  save: [secrets: { key: string, description: string, projectId: string, values: { environment: Environment, value: string }[] }[], removedKeys: { key: string, environment: Environment }[]]
}>()

const { isRawEditorOpen, closeDialog } = useUIState()
const editorContent = ref("")
const environments: Environment[] = ["DEVELOPMENT", "STAGING", "PRODUCTION"]
const selectedEnv = ref<Environment>("DEVELOPMENT")
const parsedEditorValues = computed(() => parseEnv(editorContent.value))

// Build .env text from existing secrets for the selected environment
function buildEnvText(env: Environment): string {
  return props.secrets.filter(s => s.values?.some(v => v.environment === env)).map((s) => {
    return `${s.key}=${s.values?.find(v => v.environment === env)?.value ?? ""}`
  }).join("\n")
}

function parseEnv(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (!match) {
      continue
    }

    const key = match[1]?.trim() ?? ""
    let value = match[2]?.trim() ?? ""
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    const normalized = normalizeKey(key)
    if (normalized) {
      result[normalized] = value
    }
  }

  return result
}

// Current env values from existing secrets
const currentEnvValues = computed<Record<string, string>>(() => {
  const result: Record<string, string> = {}
  for (const s of props.secrets) {
    const val = s.values?.find(v => v.environment === selectedEnv.value)?.value
    if (val !== undefined) {
      result[s.key] = val
    }
  }

  return result
})

const diffItems = computed<DiffItem[]>(() => {
  const current = currentEnvValues.value
  const next = parsedEditorValues.value
  const items: DiffItem[] = []

  // Added or updated
  for (const [key, value] of Object.entries(next)) {
    if (!(key in current)) {
      items.push({ key, value, type: "added", icon: "ph:plus-bold", class: "bg-success" })
    }
    else if (current[key] !== value) {
      items.push({ key, value, type: "updated", icon: "ph:pencil-bold", class: "bg-secondary/15 text-secondary" })
    }
  }

  // Removed (existed before, not in editor anymore)
  for (const key of Object.keys(current)) {
    if (!(key in next)) {
      items.push({ key, type: "removed", icon: "ph:minus-bold", class: "bg-danger" })
    }
  }

  return items
})

const hasDiff = computed(() => diffItems.value.length > 0)

function handleSubmit() {
  const next = parsedEditorValues.value

  // Secrets to upsert (added or updated)
  const upserted = Object.entries(next).filter(([key, value]) => {
    const current = currentEnvValues.value[key]
    return current === undefined || current !== value
  }).map(([key, value]) => ({
    key,
    description: props.secrets.find(s => s.key === key)?.description ?? "",
    projectId: props.projectId,
    values: [{ environment: selectedEnv.value, value }],
  }))

  // Keys that were removed from the editor
  const removed = Object.keys(currentEnvValues.value).filter(key => !(key in next)).map(key => ({ key, environment: selectedEnv.value }))

  emit("save", upserted, removed)
}

// Populate editor when dialog opens or env switches
watch(isRawEditorOpen, (open) => {
  if (open) {
    selectedEnv.value = "DEVELOPMENT"
    editorContent.value = buildEnvText("DEVELOPMENT")
  }
})
</script>
