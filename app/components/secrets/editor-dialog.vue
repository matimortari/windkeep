<template>
  <Dialog :is-open="isRawEditorOpen" title="Raw .env Editor" @update:is-open="closeDialog('raw')">
    <div class="flex w-full max-w-xl flex-col gap-3 overflow-hidden">
      <div class="flex flex-row gap-1 rounded-lg border p-1">
        <button
          v-for="env in ENVIRONMENTS" :key="env.value"
          class="flex-1 rounded-md px-2 py-1 text-sm font-medium transition-colors" :class="selectedEnv === env.value ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'"
          type="button" @click=" selectedEnv = env.value; editorContent = buildEnvText(env.value) "
        >
          {{ env.label }}
        </button>
      </div>

      <div class="flex min-w-0 flex-col gap-1">
        <div class="flex items-center justify-between">
          <label for="env-content" class="text-sm font-semibold">.env content</label>
          <span class="text-xs text-muted-foreground">{{ environments.find(env => env.value === selectedEnv)?.label }} environment</span>
        </div>
        <textarea
          id="env-content" v-model="editorContent"
          name="env-content" placeholder="KEY=value&#10;ANOTHER_KEY=another_value"
          class="scroll-area h-80 w-full min-w-0 resize-none overflow-x-auto font-mono text-sm" spellcheck="false"
        />
      </div>

      <div v-if="hasDiff" class="flex min-w-0 flex-col gap-1 overflow-hidden rounded-lg border p-2">
        <span class="text-xs font-semibold text-muted-foreground">Preview</span>
        <ul class="scroll-area flex max-h-40 min-w-0 flex-col gap-0.5 overflow-x-hidden overflow-y-auto">
          <li
            v-for="item in diffItems" :key="item.key"
            class="navigation-group min-w-0 items-start rounded-sm px-1.5 py-0.5 font-mono text-xs" :class="item.class"
          >
            <icon :name="item.icon" size="15" class="mt-0.5 shrink-0" />
            <span class="min-w-0 break-all whitespace-pre-wrap">
              <span class="font-semibold">{{ item.key }}</span><span v-if="item.type !== 'removed'">= {{ item.value }}</span>
            </span>
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
  save: [secrets: Secret[], removedKeys: { key: string, environment: Environment }[]]
}>()

const { isRawEditorOpen, closeDialog } = useUIState()
const editorContent = ref("")
const environments: { value: Environment, label: string }[] = ENVIRONMENTS
const selectedEnv = ref<Environment>("DEVELOPMENT")
const parsedEditorValues = computed(() => parseEnv(editorContent.value))

// Build .env text from existing secrets for the selected environment
function buildEnvText(env: Environment): string {
  return props.secrets.filter(s => s.values?.some(v => v.environment === env)).map(s => `${s.key}=${s.values?.find(v => v.environment === env)?.value ?? ""}`).join("\n")
}

function parseEnv(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of text.split("\n")) {
    const trimmedKey = line.trim()
    if (!trimmedKey || trimmedKey.startsWith("#")) {
      continue
    }

    const match = trimmedKey.match(/^([^=]+)=(.*)$/)
    if (!match) {
      continue
    }

    const key = match[1]?.trim() ?? ""
    let value = match[2]?.trim() ?? ""
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    const normalizedKey = normalizeKey(key)
    if (normalizedKey) {
      result[normalizedKey] = value
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
  const items: DiffItem[] = []

  for (const [key, value] of Object.entries(parsedEditorValues.value)) {
    if (!value) {
      continue
    }

    if (!(key in currentEnvValues.value)) {
      items.push({ key, value, type: "added", icon: "ph:plus-bold", class: "bg-success/10 text-success" })
    }
    else if (currentEnvValues.value[key] !== value) {
      items.push({ key, value, type: "updated", icon: "ph:pencil-bold", class: "bg-warning/10 text-warning" })
    }
  }
  for (const key of Object.keys(currentEnvValues.value)) {
    if (!(key in parsedEditorValues.value)) {
      items.push({ key, type: "removed", icon: "ph:minus-bold", class: "bg-danger/10 text-danger" })
    }
  }

  return items
})

const hasDiff = computed(() => diffItems.value.length > 0)

function handleSubmit() {
  const upserted = Object.entries(parsedEditorValues.value).filter(([key, value]) => {
    if (!value) {
      return false
    }

    const current = currentEnvValues.value[key]
    return current === undefined || current !== value
  }).map(([key, value]) => {
    const existingSecret = props.secrets.find(s => s.key === key)
    const existingValues = existingSecret?.values ?? []
    const mergedValues = [
      ...existingValues
        .filter(v => v.environment !== selectedEnv.value)
        .map(v => ({ environment: v.environment, value: v.value })),
      { environment: selectedEnv.value, value },
    ]

    return { key, description: existingSecret?.description ?? "", projectId: props.projectId, values: mergedValues }
  })

  const removed = Object.keys(currentEnvValues.value).filter(key => !(key in parsedEditorValues.value)).map(key => ({ key, environment: selectedEnv.value }))

  emit("save", upserted as Secret[], removed)
}

// Populate editor when dialog opens or env switches
watch(isRawEditorOpen, (open) => {
  if (open) {
    selectedEnv.value = "DEVELOPMENT"
    editorContent.value = buildEnvText("DEVELOPMENT")
  }
})
</script>
