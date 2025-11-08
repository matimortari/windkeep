<template>
  <div class="scroll-area w-full overflow-x-auto">
    <table class="bg-card min-w-full table-auto rounded-t-lg border md:w-full md:overflow-hidden">
      <thead>
        <tr class="bg-muted text-sm font-semibold">
          <th class="flex w-full flex-row items-center gap-2 p-2 text-start">
            <span>Key</span>
            <icon
              name="ph:arrow-down-bold" size="15"
              aria-label="Sort by Key" role="button"
              class="hover:text-accent" title="Sort by Key"
              :class="sort.direction === 'asc' ? 'rotate-180' : 'rotate-0'" @click="sort.direction = sort.direction === 'asc' ? 'desc' : 'asc'"
            />
          </th>

          <th v-for="env in environments" :key="env" class="border-x p-2 text-start capitalize md:w-1/6">
            <span>{{ env }}</span>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(secret, index) in sortedSecrets" :key="secret.key"
          v-motion :initial="{ opacity: 0 }"
          :enter="{ opacity: 1 }" :duration="400"
          :delay="100 * index" class="border"
        >
          <td class="text-muted-foreground flex flex-row items-center justify-between gap-4 p-2 font-mono text-sm font-semibold">
            <div class="flex flex-row items-center gap-2">
              <span class="w-full truncate">{{ secret.key }}</span>
              <icon
                v-if="secret.description" name="carbon:information-square"
                :title="secret.description ?? undefined" size="15"
                class="hidden shrink-0 cursor-pointer md:inline"
              />
            </div>

            <nav class="flex items-center justify-end gap-2 md:justify-start">
              <button aria-label="Toggle Secret Value Visibility" class="flex items-center" @click="visibleKeys[secret.key] = !visibleKeys[secret.key]">
                <icon :name="visibleKeys[secret.key] ? 'carbon:view' : 'carbon:view-off'" size="20" />
              </button>
              <button aria-label="Edit Secret" class="flex items-center" @click="handleUpdateSecret(secret.key)">
                <icon name="carbon:edit" size="20" />
              </button>
              <button aria-label="Delete Secret" class="flex items-center" @click="handleDeleteSecret(secret.key)">
                <icon name="carbon:delete" size="20" />
              </button>
            </nav>
          </td>

          <td v-for="env in environments" :key="env" class="text-muted-foreground w-[150px] max-w-[150px] overflow-hidden border p-2 font-mono text-sm">
            <div class="flex flex-row items-center justify-between gap-4">
              <span
                class="max-w-[80%] truncate select-none"
                :class="[getSecretValue(secret.key, env) ? 'bg-muted hover:text-accent! cursor-pointer rounded px-1' : '']"
                @click="copyToClipboard(getSecretValue(secret.key, env))"
              >
                {{ renderValue(secret.key, env) }}
              </span>

              <button aria-label="Copy Secret Value" @click="copyToClipboard(getSecretValue(secret.key, env))">
                <icon name="carbon:copy" size="20" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  secrets: Secret[]
  projectId: string
}>()

const emit = defineEmits(["edit", "deleted", "update"])

const { deleteSecret } = useProjectActions()

const visibleKeys = ref<Record<string, boolean>>({})
const environments = ref(["DEVELOPMENT", "STAGING", "PRODUCTION"])
const sort = ref<{ key: string, direction: "asc" | "desc" }>({
  key: "key",
  direction: "asc",
})

const sortedSecrets = computed(() => {
  return [...props.secrets].sort((a, b) => {
    if (sort.value.direction === "asc") {
      return a.key.localeCompare(b.key)
    }
    else {
      return b.key.localeCompare(a.key)
    }
  })
})

function getSecretValue(key: string, env: string) {
  const secretsWithKey = props.secrets.filter(s => s.key === key)
  for (const secret of secretsWithKey) {
    const val = secret.values?.find(v => v.environment === env)
    if (val?.value) {
      return val.value
    }
  }

  return ""
}

function renderValue(key: string, env: string): string {
  const secretValue = getSecretValue(key, env)
  if (!secretValue) {
    return "—"
  }

  return visibleKeys.value[key] ? secretValue : "•".repeat(Math.min(secretValue.length))
}

function handleUpdateSecret(key: string) {
  const secret = props.secrets.find(s => s.key === key)
  if (secret) {
    emit("edit", secret)
  }
}

async function handleDeleteSecret(key: string) {
  if (!confirm(`Are you sure you want to delete the secret "${key}"?`))
    return

  const secret = props.secrets.find(s => s.key === key)
  if (secret?.id) {
    await deleteSecret(props.projectId, secret.id)
    emit("deleted", key)
  }
}
</script>
