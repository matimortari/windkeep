<template>
  <Dialog :is-open="isSecretsEditorOpen" :title="isUpdateMode ? 'Edit Secret' : 'Create New Secret'" @update:is-open="closeDialog('secrets')">
    <form class="flex flex-col gap-2" @submit.prevent="handleSubmit">
      <div class="flex flex-col items-start gap-1">
        <label for="key" class="text-sm font-semibold">Key</label>
        <input id="key" v-model="form.key" type="text">
        <span class="text-xs text-muted-foreground">The name for the secret.</span>
      </div>

      <div class="flex flex-col items-start gap-1">
        <label for="description" class="text-sm font-semibold">Description (optional)</label>
        <input id="description" v-model="form.description" type="text">
        <span class="text-xs text-muted-foreground">An optional description for the secret usage.</span>
      </div>

      <div class="flex flex-col items-start gap-1">
        <label for="new-tag" class="text-sm font-semibold">Tags</label>
        <div class="flex w-full flex-row gap-2">
          <input
            id="new-tag" v-model="newTagInput"
            type="text" placeholder="Add a tag..."
            @keydown.enter.prevent="addTag"
          >
          <button type="button" class="btn" aria-label="Add tag" @click="addTag">
            <icon name="ph:plus-bold" size="15" />
          </button>
        </div>

        <div v-if="form.tags.length" class="mt-1 flex flex-wrap gap-1.5">
          <span v-for="tag in form.tags" :key="tag" class="inline-flex items-center gap-1 rounded-sm border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {{ tag }}
            <button type="button" class="text-muted-foreground hover:text-danger" @click="removeTag(tag)">
              <icon name="ph:x-bold" size="15" />
            </button>
          </span>
        </div>
      </div>

      <h5 class="mt-2 border-t py-2">
        Environments
      </h5>

      <div v-for="env in ['DEVELOPMENT', 'STAGING', 'PRODUCTION']" :key="env" class="flex flex-col items-start gap-1">
        <label :for="env" class="text-xs font-medium">{{ capitalizeFirst(env) }}</label>
        <input :id="env" v-model="form.values[env]" type="text">
      </div>

      <footer class="flex flex-row items-center justify-end">
        <div class="navigation-group">
          <button type="button" class="btn-ghost" @click="emit('close')">
            Cancel
          </button>
          <button class="btn-success" type="submit">
            Save
          </button>
        </div>
      </footer>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  selectedSecret: Secret | null
  projectId: string
}>()

const emit = defineEmits<{ close: [], save: [payload: Secret] }>()

const { isSecretsEditorOpen, closeDialog } = useUIState()
const environments: Environment[] = ["DEVELOPMENT", "STAGING", "PRODUCTION"]
const form = ref<{ key: string, description: string, tags: string[], values: Record<Environment, string> }>({
  key: "",
  description: "",
  tags: [],
  values: { DEVELOPMENT: "", STAGING: "", PRODUCTION: "" },
})

const newTagInput = ref("")
const isUpdateMode = computed(() => !!props.selectedSecret?.id)

function addTag() {
  const tag = newTagInput.value.trim()
  if (!tag) {
    return
  }
  if (!form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
  newTagInput.value = ""
}

function removeTag(tagToRemove: string) {
  form.value.tags = form.value.tags.filter(tag => tag !== tagToRemove)
}

async function handleSubmit() {
  const normalizedKey = normalizeKey(form.value.key)
  if (!normalizedKey) {
    return
  }

  const values = Object.entries(form.value.values).filter(([_, value]) => value.trim() !== "").map(([env, value]) => ({
    environment: env as Environment,
    value: value.trim(),
  }))

  const secret: Secret = {
    id: props.selectedSecret?.id || "",
    key: normalizedKey,
    description: form.value.description.trim(),
    tags: form.value.tags,
    projectId: props.projectId,
    project: {} as Project,
    values: values as SecretValue[],
  }

  emit("save", secret)
}

function resetForm() {
  if (props.selectedSecret) {
    const mappedValues: Record<Environment, string> = { DEVELOPMENT: "", STAGING: "", PRODUCTION: "" }
    if (props.selectedSecret.values) {
      for (const sv of props.selectedSecret.values) {
        mappedValues[sv.environment] = sv.value
      }
    }

    form.value = {
      key: props.selectedSecret.key,
      description: props.selectedSecret.description || "",
      tags: props.selectedSecret.tags ? [...props.selectedSecret.tags] : [],
      values: mappedValues,
    }
  }
  else {
    form.value = { key: "", description: "", tags: [], values: { DEVELOPMENT: "", STAGING: "", PRODUCTION: "" } }
  }
  newTagInput.value = ""
}

// Reset form when dialog is opened or selected secret changes
watch([isSecretsEditorOpen, () => props.selectedSecret], ([open]) => {
  if (open) {
    resetForm()
  }
}, { immediate: true })
</script>
