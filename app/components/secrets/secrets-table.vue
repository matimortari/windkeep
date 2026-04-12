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
        <tr
          v-for="(secret, index) in sortedSecrets" :key="`${secret.key}-${index}`"
          class="group hover:bg-muted/20" :class="getRowClass(secret.key)"
          :data-change-type="getPendingChangeType(secret.key) ?? 'none'"
        >
          <td v-for="col in columns" :key="col.key" :class="[col.class, col.key === 'key' ? 'overflow-visible!' : '']">
            <div v-if="col.key === 'key'" class="navigation-group font-mono text-sm font-semibold">
              <icon v-if="getPendingIconName(secret.key)" :name="getPendingIconName(secret.key)!" size="20" class="shrink-0" />
              <span class="truncate"><span class="opacity-70">{{ index + 1 }}.</span> {{ secret.key }}</span>
              <span v-if="secret.description" class="group/tooltip relative hidden shrink-0 cursor-pointer md:inline-flex">
                <icon name="ph:info-bold" size="15" />
                <span class="card pointer-events-none absolute bottom-full left-1/2 w-max -translate-x-1/2 p-1! text-xs! opacity-0 transition-opacity group-hover/tooltip:opacity-100">{{ secret.description }}</span>
              </span>
            </div>

            <div v-else-if="col.type === 'env'" class="flex items-center justify-between gap-4 overflow-hidden font-mono text-sm">
              <span class="max-w-[80%] truncate select-none" aria-label="Hidden value" :class="[getSecretValue(secret.key, col.env) ? getSecretValueClass(secret.key) : '']">{{ renderValue(secret.key, col.env) }}</span>
              <button v-if="getSecretValue(secret.key, col.env)" :aria-label="`Copy ${secret.key} value for ${col.env}`" @click="handleCopy(secret.key, col.env, getSecretValue(secret.key, col.env))">
                <icon :name="getCopyIcon(secret.key, col.env)" size="20" class="hover:text-primary" />
              </button>
            </div>

            <div v-else-if="col.key === 'actions'" class="navigation-group">
              <button aria-label="View history" @click="emit('history', secret)">
                <icon name="ph:clock-counter-clockwise-bold" size="20" class="hover:text-primary" />
              </button>
              <button :aria-label="`Toggle visibility for ${secret.key}`" @click="visibleKeys[secret.key] = !isKeyVisible(secret.key)">
                <icon :name="isKeyVisible(secret.key) ? 'ph:eye-closed-bold' : 'ph:eye-bold'" size="20" class="hover:text-primary" />
              </button>
              <button v-if="isOwner(props.projectId) || isAdmin(props.projectId)" aria-label="Edit Secret" @click="emit('edit', secret)">
                <icon name="ph:note-pencil-bold" size="20" class="hover:text-primary" />
              </button>
              <button v-if="isOwner(props.projectId) || isAdmin(props.projectId)" aria-label="Delete Secret" @click="emit('delete', secret.key)">
                <icon name="ph:x-bold" size="20" class="hover:text-danger" />
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
  pendingChanges: Map<string, PendingChange>
  allVisible: boolean
}>()

const emit = defineEmits<{ edit: [secret: Secret], delete: [key: string], history: [secret: Secret], update: [] }>()

const visibleKeys = ref<Record<string, boolean>>({})
const copyStates = ref<Record<string, boolean>>({})
const { isOwner, isAdmin } = storeToRefs(useProjectStore())
const environments = ["DEVELOPMENT", "STAGING", "PRODUCTION"]
const { sortedData: sortedSecrets, toggleSort, getSortIconName } = useTableSort<Secret>(toRef(props, "secrets"))

const rowClassByChangeType: Record<"create" | "update" | "delete", string> = {
  create: "bg-success/50!",
  update: "bg-info/50!",
  delete: "bg-danger/50! line-through decoration-danger-foreground",
}

const valueClassByChangeType: Record<"create" | "update" | "delete", string> = {
  create: "rounded-lg px-1 bg-success/50!",
  update: "rounded-lg px-1 bg-info/50!",
  delete: "rounded-lg px-1 bg-danger/50!",
}

const iconNameByChangeType: Record<"create" | "update" | "delete", string> = {
  create: "ph:plus-circle-bold",
  update: "ph:pencil-circle-bold",
  delete: "ph:minus-circle-bold",
}

const secretValuesByKey = computed(() => {
  const map = new Map<string, Map<string, string>>()
  for (const secret of props.secrets) {
    const valuesByEnvironment = new Map<string, string>()
    for (const value of secret.values ?? []) {
      valuesByEnvironment.set(value.environment, value.value)
    }

    map.set(secret.key, valuesByEnvironment)
  }

  return map
})

const columns = computed<Record<string, any>[]>(() => {
  const base = [{ key: "key", label: "Key", class: "w-full", type: "base", sortable: true }]
  const envCols = environments.map(env => ({ key: env.toLowerCase(), label: env.charAt(0) + env.slice(1).toLowerCase(), env, type: "env", class: "max-w-40 md:max-w-52", sortable: false }))
  const actions = [{ key: "actions", label: "Actions", class: "w-20 text-right", type: "actions", sortable: false }]
  return [...base, ...envCols, ...actions]
})

function getPendingChangeType(key: string): "create" | "update" | "delete" | null {
  if (!isOwner.value(props.projectId) && !isAdmin.value(props.projectId)) {
    return null
  }

  return props.pendingChanges.get(key)?.type ?? null
}

function getRowClass(key: string) {
  const changeType = getPendingChangeType(key)
  if (!changeType) {
    return ""
  }

  return rowClassByChangeType[changeType]
}

function getPendingIconName(key: string) {
  const changeType = getPendingChangeType(key)
  if (!changeType) {
    return null
  }

  return iconNameByChangeType[changeType]
}

function getSecretValueClass(key: string) {
  const changeType = getPendingChangeType(key)
  if (!changeType) {
    return "rounded-lg px-1 bg-muted"
  }

  return valueClassByChangeType[changeType]
}

function getCopyIcon(secretKey: string, env: string) {
  return copyStates.value[`${secretKey}-${env}`] ? "ph:check-bold" : "ph:copy-bold"
}

async function handleCopy(secretKey: string, env: string, value: string) {
  if (!value) {
    return
  }
  await navigator.clipboard.writeText(value)
  copyStates.value[`${secretKey}-${env}`] = true
  setTimeout(() => copyStates.value[`${secretKey}-${env}`] = false, 1500)
}

function isKeyVisible(key: string): boolean {
  return visibleKeys.value[key] ?? props.allVisible
}

function getSecretValue(key: string, env: string) {
  return secretValuesByKey.value.get(key)?.get(env) ?? ""
}

function renderValue(key: string, env: string) {
  const val = getSecretValue(key, env)
  return val ? (isKeyVisible(key) ? val : "•".repeat(val.length)) : "—"
}
</script>

<style scoped>
tbody tr td {
  color: var(--row-text, var(--muted-foreground)) !important;
  box-shadow: inset 0 -1px 0 var(--row-divider, color-mix(in srgb, var(--muted) 30%, transparent)) !important;
}

tbody tr {
  border-bottom: none !important;
}

tbody tr[data-change-type="create"] {
  --row-text: var(--success-foreground);
  --row-divider: color-mix(in srgb, var(--success) 50%, transparent);
}
tbody tr[data-change-type="update"] {
  --row-text: var(--info-foreground);
  --row-divider: color-mix(in srgb, var(--info) 50%, transparent);
}
tbody tr[data-change-type="delete"] {
  --row-text: var(--danger-foreground);
  --row-divider: color-mix(in srgb, var(--danger) 50%, transparent);
}
</style>
