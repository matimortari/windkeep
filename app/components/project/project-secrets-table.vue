<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" :class="col.class">
            <div class="navigation-group">
              <span>{{ col.label }}</span>
              <button v-if="col.sortable" class="flex items-center hover:text-primary" :aria-label="`Sort by ${col.label}`" @click="toggleSort(col.key)">
                <icon :name="getSortIconName(col.key)" size="15" class="transition-transform" />
              </button>
            </div>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(secret, index) in sortedSecrets" :key="secret.key" class="group hover:bg-muted/20">
          <td v-for="col in columns" :key="col.key" :class="col.class">
            <div v-if="col.key === 'key'" class="flex items-center gap-2 font-mono text-sm font-semibold text-muted-foreground">
              <span class="truncate"><span class="text-primary">{{ index + 1 }}.</span> {{ secret.key }}</span>
              <icon
                v-if="secret.description" name="ph:info"
                :title="secret.description" size="15"
                class="hidden shrink-0 cursor-pointer md:inline"
              />
            </div>

            <div v-else-if="col.type === 'env'" class="flex items-center justify-between gap-4 overflow-hidden font-mono text-sm text-muted-foreground">
              <span
                class="max-w-[80%] truncate select-none"
                :class="[getSecretValue(secret.key, col.env) ? 'cursor-pointer rounded bg-muted px-1 transition-colors group-hover:bg-card! hover:text-secondary!' : '']"
                @click="copyToClipboard(getSecretValue(secret.key, col.env))"
              >
                {{ renderValue(secret.key, col.env) }}
              </span>

              <button v-if="getSecretValue(secret.key, col.env)" aria-label="Copy Secret Value" @click="copySecret(secret.key, col.env, getSecretValue(secret.key, col.env))">
                <icon :name="getCopyIcon(secret.key, col.env)" size="20" class="hover:text-primary" />
              </button>
            </div>

            <div v-else-if="col.key === 'actions'" class="navigation-group text-muted-foreground">
              <button aria-label="Toggle visibility" @click="visibleKeys[secret.key] = !visibleKeys[secret.key]">
                <icon :name="visibleKeys[secret.key] ? 'ph:eye-closed' : 'ph:eye'" size="20" class="hover:text-primary" />
              </button>
              <button aria-label="Edit Secret" @click="handleUpdateSecret(secret.key)">
                <icon name="ph:note-pencil" size="20" class="hover:text-primary" />
              </button>
              <button aria-label="Delete Secret" @click="handleDeleteSecret(secret.key)">
                <icon name="ph:x" size="20" class="hover:text-danger" />
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

const emit = defineEmits<{
  (e: "edit", secret: Secret): void
  (e: "deleted", key: string): void
  (e: "update"): void
}>()

const projectStore = useProjectStore()
const visibleKeys = ref<Record<string, boolean>>({})
const copyStates = ref<Record<string, boolean>>({})
const environments = ["DEVELOPMENT", "STAGING", "PRODUCTION"]
const { sortedData: sortedSecrets, toggleSort, getSortIconName } = useTableSort<Secret>(toRef(props, "secrets"))

const columns = computed<Record<string, any>[]>(() => {
  const base = [{ key: "key", label: "Key", class: "w-full", type: "base", sortable: true }]
  const envCols = environments.map(env => ({
    key: env.toLowerCase(),
    label: env.charAt(0) + env.slice(1).toLowerCase(),
    env,
    type: "env",
    class: "max-w-40 md:max-w-52",
    sortable: false,
  }))
  const actions = [{ key: "actions", label: "Actions", class: "w-20 text-right", type: "actions", sortable: false }]
  return [...base, ...envCols, ...actions]
})

function getCopyStateKey(secretKey: string, env: string) {
  return `${secretKey}-${env}`
}

function getCopyIcon(secretKey: string, env: string) {
  const key = getCopyStateKey(secretKey, env)
  return copyStates.value[key] ? "ph:check" : "ph:copy"
}

async function copySecret(secretKey: string, env: string, value: string) {
  if (!value) {
    return
  }

  await navigator.clipboard.writeText(value)

  const key = getCopyStateKey(secretKey, env)
  copyStates.value[key] = true

  setTimeout(() => {
    copyStates.value[key] = false
  }, 1500)
}

function getSecretValue(key: string, env: string) {
  const s = props.secrets.find(s => s.key === key)
  return s?.values?.find(v => v.environment === env)?.value ?? ""
}

function renderValue(key: string, env: string) {
  const val = getSecretValue(key, env)
  return val ? (visibleKeys.value[key] ? val : "•".repeat(val.length)) : "—"
}

function handleUpdateSecret(key: string) {
  const secret = props.secrets.find(s => s.key === key)
  if (secret) {
    emit("edit", secret)
  }
}

async function handleDeleteSecret(key: string) {
  if (!confirm(`Are you sure you want to delete "${key}"?`)) {
    return
  }

  const secret = props.secrets.find(s => s.key === key)
  if (secret?.id) {
    await projectStore.deleteProjectSecret(props.projectId, secret.id)
    emit("deleted", key)
  }
}
</script>
