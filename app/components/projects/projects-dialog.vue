<template>
  <Dialog :is-open="isProjectsEditorOpen" title="Create New Project" @update:is-open="closeDialog('projects')">
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

      <footer class="flex flex-row items-center justify-end">
        <nav class="navigation-group">
          <button class="btn-ghost" @click="emit('close')">
            Cancel
          </button>
          <button class="btn-success" type="submit">
            Save
          </button>
        </nav>
      </footer>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
const emit = defineEmits<{ close: [], save: [payload: { name: string, description: string }] }>()

const { isProjectsEditorOpen, closeDialog } = useUIState()
const form = ref<{ name: string, description: string }>({ name: "", description: "" })

async function handleSubmit() {
  if (!form.value.name.trim()) {
    return
  }

  emit("save", { name: form.value.name.trim(), description: form.value.description.trim() })
}

// Reset form when dialog is opened
watch(isProjectsEditorOpen, (open) => {
  if (open) {
    form.value.name = ""
    form.value.description = ""
  }
}, { immediate: true })
</script>
