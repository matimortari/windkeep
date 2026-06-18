<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" :class="col.class">
            <div class="navigation-group">
              <span>{{ col.label }}</span>
              <button v-if="col.sortable" class="flex items-center hover:text-secondary" :aria-label="`Sort by ${col.label}`" @click="toggleSort(col.key)">
                <icon :name="getSortIconName(col.key)" size="15" class="transition-transform" />
              </button>
            </div>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(secret, index) in sortedSecrets" :key="`${secret.key}-${index}`"
          class="group hover:bg-muted/20" :class="getChangeConfig(secret.key)?.rowClass"
          :data-change-type="getChangeConfig(secret.key) ? props.pendingChanges.get(secret.key)?.type : 'none'"
        >
          <td v-for="col in columns" :key="col.key" :class="[col.class, col.key === 'key' ? 'overflow-visible!' : '']">
            <div v-if="col.key === 'key'" class="navigation-group font-mono text-sm font-semibold" :class="getChangeConfig(secret.key)?.keyTextClass">
              <icon v-if="getChangeConfig(secret.key)?.icon" :name="getChangeConfig(secret.key)!.icon" size="20" class="shrink-0" />

              <span class="truncate"><span class="opacity-70">{{ index + 1 }}.</span> {{ secret.key }}</span>

              <span v-if="secret.description" class="group/tooltip relative hidden shrink-0 cursor-pointer md:inline-flex">
                <icon name="ph:info-bold" size="15" />
                <span class="card pointer-events-none absolute bottom-full left-1/2 w-max -translate-x-1/2 p-1! text-xs! opacity-0 transition-opacity group-hover/tooltip:opacity-100">{{ secret.description }}</span>
              </span>

              <div v-if="secret.tags?.length" class="hidden flex-wrap items-center gap-1 md:flex">
                <button
                  v-for="tag in secret.tags" :key="tag"
                  class="rounded-full px-1.5 py-0.5 text-xs font-medium transition-colors" :class="activeTagFilter === tag ? 'bg-secondary/20 text-secondary' : 'bg-muted/30 text-muted-foreground hover:bg-secondary/10 hover:text-secondary'"
                  :aria-label="`Filter by tag ${tag}`" @click="emit('filterByTag', activeTagFilter === tag ? null : tag)"
                >
                  {{ tag }}
                </button>
              </div>
            </div>

            <div v-else-if="col.type === 'env'" class="flex items-center justify-between gap-4 overflow-hidden font-mono text-sm">
              <span class="max-w-[80%] truncate tracking-wide select-none" aria-label="Hidden value" :class="getSecretValueClass(secret.key, !!secretValuesByKey.get(secret.key)?.get(col.env))">{{ renderValue(secret.key, col.env) }}</span>
              <button v-if="secretValuesByKey.get(secret.key)?.get(col.env)" :aria-label="`Copy ${secret.key} value for ${col.env}`" @click="handleCopy(secret.key, col.env, secretValuesByKey.get(secret.key)!.get(col.env)!)">
                <icon :name="copyStates[`${secret.key}-${col.env}`] ? 'ph:check-bold' : 'ph:copy-bold'" size="20" :class="getActionIconClass(secret.key, 'primary')" />
              </button>
            </div>

            <div v-else-if="col.key === 'actions'" class="navigation-group">
              <button aria-label="View history" @click="emit('history', secret)">
                <icon name="ph:clock-counter-clockwise-bold" size="20" :class="getActionIconClass(secret.key, 'primary')" />
              </button>
              <button :aria-label="`Toggle visibility for ${secret.key}`" @click="visibleKeys[secret.key] = !(visibleKeys[secret.key] ?? props.allVisible)">
                <icon :name="(visibleKeys[secret.key] ?? props.allVisible) ? 'ph:eye-closed-bold' : 'ph:eye-bold'" size="20" :class="getActionIconClass(secret.key, 'primary')" />
              </button>
              <button v-if="isOwner(props.projectId) || isAdmin(props.projectId)" aria-label="Edit Secret" @click="emit('edit', secret)">
                <icon name="ph:note-pencil-bold" size="20" :class="getActionIconClass(secret.key, 'primary')" />
              </button>
              <button v-if="isOwner(props.projectId) || isAdmin(props.projectId)" aria-label="Delete Secret" @click="emit('delete', secret.key)">
                <icon name="ph:x-bold" size="20" :class="getActionIconClass(secret.key, 'danger')" />
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
  activeTagFilter: string | null
}>()

const emit = defineEmits<{
  edit: [secret: Secret]
  delete: [key: string]
  history: [secret: Secret]
  update: []
  filterByTag: [tag: string | null]
}>()

const visibleKeys = ref<Record<string, boolean>>({})
const copyStates = ref<Record<string, boolean>>({})
const { isOwner, isAdmin } = storeToRefs(useProjectStore())
const environments = ["DEVELOPMENT", "STAGING", "PRODUCTION"]
const { sortedData: sortedSecrets, toggleSort, getSortIconName } = useTableSort<Secret>(toRef(props, "secrets"))
const changeTypeConfig = {
  create: {
    rowClass: "bg-success/10 text-success!",
    keyTextClass: "text-success-foreground",
    valueClass: "rounded-full px-1.5 py-0.5 bg-success/10 text-success font-medium",
    icon: "ph:plus-circle-bold",
  },
  update: {
    rowClass: "bg-warning/10 text-warning!",
    keyTextClass: "text-warning-foreground",
    valueClass: "rounded-full px-1.5 py-0.5 bg-warning/10 text-warning font-medium",
    icon: "ph:pencil-circle-bold",
  },
  delete: {
    rowClass: "bg-danger/10 text-danger! line-through decoration-danger",
    keyTextClass: "text-danger-foreground",
    valueClass: "rounded-full px-1.5 py-0.5 bg-danger/10 text-danger font-medium line-through",
    icon: "ph:minus-circle-bold",
  },
}

const secretValuesByKey = computed(() => {
  const map = new Map<string, Map<string, string>>()
  for (const secret of props.secrets) {
    const valuesByEnv = new Map<string, string>()
    for (const value of secret.values ?? []) {
      valuesByEnv.set(value.environment, value.value)
    }
    map.set(secret.key, valuesByEnv)
  }

  return map
})

const columns = computed<Record<string, any>[]>(() => {
  const base = [{ key: "key", label: "Key", class: "w-2/4", type: "base", sortable: true }]
  const envCols = environments.map(env => ({
    key: env.toLowerCase(),
    label: env.charAt(0) + env.slice(1).toLowerCase(),
    env,
    type: "env",
    sortable: false,
  }))
  const actions = [{ key: "actions", label: "Actions", class: "w-32 text-right", type: "actions", sortable: false }]
  return [...base, ...envCols, ...actions]
})

function getChangeConfig(key: string) {
  if (!isOwner.value(props.projectId) && !isAdmin.value(props.projectId)) {
    return null
  }

  const type = props.pendingChanges.get(key)?.type
  return type ? changeTypeConfig[type] : null
}

function getSecretValueClass(key: string, hasValue: boolean) {
  const config = getChangeConfig(key)
  if (!config) {
    return hasValue ? "rounded-full px-1.5 py-0.5 bg-muted/30 font-medium" : "text-muted-foreground/40"
  }

  return config.valueClass
}

function getActionIconClass(key: string, defaultTone: "primary" | "danger" = "primary") {
  if (getChangeConfig(key)) {
    return "text-current opacity-80 hover:opacity-100"
  }

  return defaultTone === "danger" ? "hover:text-danger text-muted-foreground" : "hover:text-secondary text-muted-foreground"
}

async function handleCopy(secretKey: string, env: string, value: string) {
  if (!value) {
    return
  }

  await navigator.clipboard.writeText(value)
  copyStates.value[`${secretKey}-${env}`] = true
  setTimeout(() => copyStates.value[`${secretKey}-${env}`] = false, 1500)
}

function renderValue(key: string, env: string) {
  const val = secretValuesByKey.value.get(key)?.get(env)
  if (!val) {
    return "—"
  }

  return (visibleKeys.value[key] ?? props.allVisible) ? val : "••••••••"
}
</script>

<style scoped>
tbody tr {
  border-bottom: 1px solid color-mix(in srgb, var(--muted) 40%, transparent);
}
tbody tr:last-child {
  border-bottom: none;
}
tbody tr[data-change-type="create"] {
  border-bottom-color: color-mix(in srgb, var(--success) 30%, transparent);
}
tbody tr[data-change-type="update"] {
  border-bottom-color: color-mix(in srgb, var(--warning) 30%, transparent);
}
tbody tr[data-change-type="delete"] {
  border-bottom-color: color-mix(in srgb, var(--danger) 30%, transparent);
}
</style>
