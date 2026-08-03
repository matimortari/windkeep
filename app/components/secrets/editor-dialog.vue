<template>
  <Dialog :is-open="isRawEditorOpen" title="Raw .env Editor" @update:is-open="closeDialog('raw')">
    <div class="flex w-full max-w-xl flex-col gap-2 overflow-hidden">
      <div class="flex flex-row gap-1 rounded-lg border p-1">
        <button
          v-for="env in ENVIRONMENTS" :key="env.value"
          type="button" class="flex-1 rounded-md px-2 py-1 text-sm font-medium transition-colors"
          :class="selectedEnv === env.value ? 'bg-primary' : 'text-muted-foreground hover:text-foreground'" @click="selectEnvironment(env.value)"
        >
          {{ env.label }}
        </button>
      </div>

      <div class="flex min-w-0 flex-col gap-1">
        <div class="flex items-center justify-between">
          <label for="env-content" class="text-sm font-semibold">.env content</label>
          <span class="text-xs text-muted-foreground">{{ ENVIRONMENTS.find(env => env.value === selectedEnv)?.label }} environment</span>
        </div>
        <textarea
          id="env-content" v-model="editorContent"
          name="env-content" placeholder="KEY=value&#10;ANOTHER_KEY=another_value"
          class="scroll-area h-80 w-full min-w-0 resize-none overflow-x-auto font-mono text-sm" spellcheck="false"
        />
      </div>

      <div v-if="hasPreview" class="flex min-w-0 flex-col gap-1 overflow-hidden rounded-lg border p-2">
        <span class="text-xs font-semibold text-muted-foreground">Preview</span>
        <ul class="scroll-area flex max-h-40 min-w-0 flex-col gap-0.5 overflow-x-hidden overflow-y-auto">
          <li
            v-for="item in previewItems" :key="item.key"
            class="navigation-group min-w-0 items-start rounded-sm px-1.5 py-0.5 font-mono text-xs" :class="item.class"
          >
            <icon :name="item.icon" size="15" class="mt-0.5 shrink-0" />
            <span class="min-w-0 break-all whitespace-pre-wrap">
              <span class="font-semibold">{{ item.key }}</span><span v-if="item.type !== 'removed'">= {{ item.value }}</span>
            </span>
          </li>
        </ul>
      </div>

      <p v-else-if="editorContent.trim() && !hasPreview" class="text-xs text-muted-foreground">
        No changes detected from current state.
      </p>

      <footer class="flex flex-row items-center justify-end">
        <div class="navigation-group">
          <button type="button" class="btn-ghost" @click="emit('close')">
            Cancel
          </button>
          <button type="button" class="btn-success" :disabled="!hasPreview" @click="handleSubmit">
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
  initialContent?: string | null
}>()

const emit = defineEmits<{
  "close": []
  "save": [secrets: Secret[], removedKeys: { key: string, environment: Environment }[]]
  "update:initialContent": [value: string | null]
}>()

const { isRawEditorOpen, closeDialog } = useUIState()
const { selectedEnv, editorContent, previewItems, hasPreview, selectEnvironment, resetEditor, getChanges } = useEnvEditor({
  secrets: () => props.secrets,
  projectId: () => props.projectId,
})

function handleSubmit() {
  const { upserted, removed } = getChanges()
  emit("save", upserted, removed)
}

watch(isRawEditorOpen, (open) => {
  if (open) {
    resetEditor(props.initialContent)
    if (props.initialContent) {
      emit("update:initialContent", null)
    }
  }
})
</script>
