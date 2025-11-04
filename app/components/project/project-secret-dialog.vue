<template>
  <Dialog
    :is-open="isOpen"
    :title="isUpdateMode ? 'Edit Secret' : 'Create New Secret'"
    @update:is-open="emit('close')"
  >
    <form class="flex flex-col gap-2" @submit.prevent="handleSubmit">
      <div class="flex flex-col items-start gap-1">
        <label for="key" class="text-sm font-semibold">Key</label>
        <input
          id="key"
          v-model="form.key"
          type="text"
          class="w-full"
          :disabled="isUpdateMode"
        >
        <span class="text-muted-foreground text-xs">
          The name for the secret.
        </span>
      </div>

      <div class="flex flex-col items-start gap-1">
        <label for="description" class="text-sm font-semibold">Description (optional)</label>
        <input id="description" v-model="form.description" type="text" class="w-full">
        <span class="text-muted-foreground text-xs">
          An optional description for the secret usage.
        </span>
      </div>

      <h5 class="border-t py-2">
        Environments
      </h5>

      <div v-for="env in environments" :key="env" class="flex flex-col items-start gap-1">
        <label :for="env" class="text-xs font-semibold capitalize">{{ env }}</label>
        <input :id="env" v-model="form.values[env]" type="text" class="w-full">
      </div>

      <footer class="flex flex-row items-center justify-between">
        <p class="text-warning">
          {{ validationError || (isUpdateMode ? errors.updateProjectSecret : errors.createProjectSecret) || '' }}
        </p>

        <div class="navigation-group">
          <button class="text-sm font-semibold hover:underline" aria-label="Cancel" @click="emit('close')">
            Cancel
          </button>
          <button
            class="btn-success"
            type="submit"
            aria-label="Save Secret"
            :disabled="loading"
          >
            Save
          </button>
        </div>
      </footer>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  selectedSecret?: Secret | null
  projectId: string
}>()

const emit = defineEmits<{
  (e: "close"): void
  (e: "save", payload: Secret): void
}>()

const environments: Environment[] = ["DEVELOPMENT", "STAGING", "PRODUCTION"]

const { createSecret, updateSecret, errors, loading } = useProjectActions()

const form = ref<{ key: string, description: string, values: Record<Environment, string> }>({
  key: "",
  description: "",
  values: { DEVELOPMENT: "", STAGING: "", PRODUCTION: "" },
})

const validationError = ref<string | null>(null)

const isUpdateMode = computed(() => !!props.selectedSecret?.id)

function resetForm() {
  if (props.selectedSecret) {
    const mappedValues: Record<Environment, string> = { DEVELOPMENT: "", STAGING: "", PRODUCTION: "" }
    props.selectedSecret.values?.forEach((sv) => {
      mappedValues[sv.environment] = sv.value
    })
    form.value = {
      key: props.selectedSecret.key,
      description: props.selectedSecret.description || "",
      values: mappedValues,
    }
  }
  else {
    form.value = {
      key: "",
      description: "",
      values: { DEVELOPMENT: "", STAGING: "", PRODUCTION: "" },
    }
  }

  validationError.value = null
}

function normalizeKey(key: string): string {
  return key
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
}

async function handleSubmit() {
  validationError.value = null

  if (!form.value.key.trim()) {
    validationError.value = "Secret key is required"
    return
  }

  const normalizedKey = normalizeKey(form.value.key)

  if (!normalizedKey) {
    validationError.value = "Secret key must contain at least one valid character"
    return
  }

  if (isUpdateMode.value) {
    await updateSecret(props.projectId, props.selectedSecret!.id, {
      description: form.value.description.trim(),
    })
  }
  else {
    await createSecret(props.projectId, {
      key: normalizedKey,
      description: form.value.description.trim(),
      projectId: props.projectId,
    })
  }

  emit("close")
}

watch(() => props.isOpen, (open) => {
  if (open)
    resetForm()
}, { immediate: true })

watch(() => props.selectedSecret, () => {
  if (props.isOpen)
    resetForm()
}, { deep: true })
</script>
