<template>
  <Dialog :is-open="isOpen" title="Create New Project" @update:is-open="emit('close')">
    <form class="flex flex-col gap-2" @submit.prevent="handleSubmit">
      <div class="flex flex-col items-start gap-1">
        <label for="name" class="text-sm font-semibold">Project Name</label>
        <input id="name" v-model="form.name" type="text">
        <span class="text-xs text-muted-foreground">The name for the project.</span>
      </div>

      <div class="flex flex-col items-start gap-1">
        <label for="description" class="text-sm font-semibold">Description</label>
        <input id="description" v-model="form.description" type="text">
        <span class="text-xs text-muted-foreground">An optional description for your project.</span>
      </div>

      <footer class="flex flex-row items-center justify-between">
        <p class="text-danger">
          {{ errors.createProject || " " }}
        </p>

        <nav class="navigation-group">
          <button class="text-sm font-semibold hover:underline" aria-label="Cancel" @click="emit('close')">
            Cancel
          </button>
          <button class="btn-success" type="submit" aria-label="Save Project">
            Save
          </button>
        </nav>
      </footer>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{ close: [], save: [payload: { name: string, description: string }] }>()

const { errors } = storeToRefs(useProjectStore())
const form = ref<{ name: string, description: string }>({ name: "", description: "" })

async function handleSubmit() {
  const payload = { name: form.value.name.trim(), description: form.value.description.trim() }

  emit("save", payload)
}

// Reset form and clear errors when dialog is opened
watch(() => props.isOpen, (open) => {
  if (open) {
    form.value.name = ""
    form.value.description = ""

    if (errors.value.createProject) {
      errors.value.createProject = null
    }
  }
}, { immediate: true })
</script>
