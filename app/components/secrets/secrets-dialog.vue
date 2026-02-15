<template>
  <Dialog :is-open="isOpen" :title="isUpdateMode ? 'Edit Secret' : 'Create New Secret'" @update:is-open="emit('close')">
    <form class="flex flex-col gap-2" @submit.prevent="handleSubmit">
      <div class="flex flex-col items-start gap-1">
        <label for="key" class="text-sm font-semibold">Key</label>
        <input id="key" v-model="form.key" type="text" required>
        <span class="text-xs text-muted-foreground">The name for the secret.</span>
      </div>

      <div class="flex flex-col items-start gap-1">
        <label for="description" class="text-sm font-semibold">Description (optional)</label>
        <input id="description" v-model="form.description" type="text">
        <span class="text-xs text-muted-foreground">An optional description for the secret usage.</span>
      </div>

      <h5 class="border-t py-2">
        Environments
      </h5>

      <div v-for="env in environments" :key="env" class="flex flex-col items-start gap-1">
        <label :for="env" class="text-xs font-medium">{{ capitalizeFirst(env) }}</label>
        <input :id="env" v-model="form.values[env]" type="text">
      </div>

      <footer class="flex flex-row items-center justify-between">
        <p class="text-danger">
          {{ (isUpdateMode ? errors.updateProjectSecret : errors.createProjectSecret) || '' }}
        </p>

        <div class="navigation-group">
          <button class="text-sm font-semibold hover:underline" aria-label="Cancel" @click="emit('close')">
            Cancel
          </button>
          <button class="btn-success" type="submit" aria-label="Save Secret" :disabled="loading">
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

const emit = defineEmits<{ (e: "close"): void, (e: "save", payload: Secret): void }>()

const environments: Environment[] = ["DEVELOPMENT", "STAGING", "PRODUCTION"]
const projectStore = useProjectStore()
const { errors, loading } = storeToRefs(projectStore)
const form = ref<{ key: string, description: string, values: Record<Environment, string> }>({
  key: "",
  description: "",
  values: { DEVELOPMENT: "", STAGING: "", PRODUCTION: "" },
})
const isUpdateMode = computed(() => !!props.selectedSecret?.id)

async function handleSubmit() {
  const values = Object.entries(form.value.values).filter(([_, value]) => value.trim() !== "").map(([environment, value]) => ({
    environment: environment as Environment,
    value: value.trim(),
  }))

  const secret: Secret = {
    id: props.selectedSecret?.id || "",
    key: normalizeKey(form.value.key),
    description: form.value.description.trim(),
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

    form.value = { key: props.selectedSecret.key, description: props.selectedSecret.description || "", values: mappedValues }
  }
  else {
    form.value = { key: "", description: "", values: { DEVELOPMENT: "", STAGING: "", PRODUCTION: "" } }
  }
}

// Reset form and clear errors when dialog is opened or selected secret changes
watch([() => props.isOpen, () => props.selectedSecret], ([open]) => {
  if (open) {
    resetForm()
    if (isUpdateMode.value && errors.value.updateProjectSecret) {
      errors.value.updateProjectSecret = null
    }
    else if (!isUpdateMode.value && errors.value.createProjectSecret) {
      errors.value.createProjectSecret = null
    }
  }
}, { immediate: true, deep: true })
</script>
