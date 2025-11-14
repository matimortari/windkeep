<template>
  <Dialog :is-open="isOpen" title="Create New Project" @update:is-open="emit('close')">
    <form class="flex flex-col gap-2" @submit.prevent="handleSubmit">
      <div class="flex flex-col items-start gap-1">
        <label for="name" class="text-sm font-semibold">Project Name</label>
        <input id="name" v-model="form.name" type="text">
      </div>

      <div class="flex flex-col items-start gap-1">
        <label for="slug" class="text-sm font-semibold">Project Slug</label>
        <input id="slug" v-model="form.slug" type="text" :placeholder="suggestedSlug">
        <span class="text-xs text-muted-foreground">
          Lowercase alphanumeric with hyphens only.
        </span>
      </div>

      <div class="flex flex-col items-start gap-1">
        <label for="description" class="text-sm font-semibold">Description</label>
        <input id="description" v-model="form.description" type="text">
        <span class="text-xs text-muted-foreground">
          An optional description for your project.
        </span>
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

const emit = defineEmits<{
  (e: "close"): void
  (e: "save", payload: { name: string, slug: string, description: string }): void
}>()

const { errors } = useProjectActions()

const form = ref<{ name: string, slug: string, description: string }>({
  name: "",
  slug: "",
  description: "",
})

const suggestedSlug = computed(() => {
  if (!form.value.name)
    return "my-project"

  return form.value.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-+)|(-+$)/g, "")
})

async function handleSubmit() {
  const finalSlug = form.value.slug.trim() || suggestedSlug.value

  const payload = {
    name: form.value.name.trim(),
    slug: finalSlug,
    description: form.value.description.trim(),
  }

  emit("save", payload)
  emit("close")
}

watch(() => props.isOpen, (open) => {
  if (open) {
    form.value.name = ""
    form.value.slug = ""
    form.value.description = ""
  }
}, { immediate: true })
</script>
