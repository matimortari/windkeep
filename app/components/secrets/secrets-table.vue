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
        <tr v-for="(secret, index) in sortedSecrets" :key="`${secret.key}-${index}`" class="group hover:bg-muted/20" :class="getRowClass(secret.key)">
          <td v-for="col in columns" :key="col.key" :class="col.class">
            <div v-if="col.key === 'key'" class="navigation-group font-mono text-sm font-semibold">
              <icon v-if="getPendingChangeType(secret.key) === 'create'" name="ph:plus-circle-bold" size="20" class="text-caption-success shrink-0" />
              <icon v-else-if="getPendingChangeType(secret.key) === 'update'" name="ph:pencil-circle-bold" size="20" class="shrink-0 text-secondary" />
              <icon v-else-if="getPendingChangeType(secret.key) === 'delete'" name="ph:minus-circle-bold" size="20" class="text-caption-danger shrink-0" />
              <span class="truncate"><span class="text-muted">{{ index + 1 }}.</span> {{ secret.key }}</span>
              <icon
                v-if="secret.description" name="ph:info-bold"
                :title="secret.description" size="15"
                class="hidden shrink-0 cursor-pointer md:inline"
              />
            </div>

            <div v-else-if="col.type === 'env'" class="flex items-center justify-between gap-4 overflow-hidden font-mono text-sm text-muted-foreground">
              <span class="max-w-[80%] truncate select-none" :class="[getSecretValue(secret.key, col.env) ? getSecretValueClass(secret.key) : '']">{{ renderValue(secret.key, col.env) }}</span>
              <button v-if="getSecretValue(secret.key, col.env)" aria-label="Copy Secret Value" @click="handleCopy(secret.key, col.env, getSecretValue(secret.key, col.env))">
                <icon :name="getCopyIcon(secret.key, col.env)" size="20" class="hover:text-primary" />
              </button>
            </div>

            <div v-else-if="col.key === 'actions'" class="navigation-group">
              <button aria-label="View history" @click="emit('history', secret)">
                <icon name="ph:clock-counter-clockwise-bold" size="20" class="hover:text-primary" />
              </button>
              <button aria-label="Toggle visibility" @click="visibleKeys[secret.key] = !visibleKeys[secret.key]">
                <icon :name="visibleKeys[secret.key] ? 'ph:eye-closed-bold' : 'ph:eye-bold'" size="20" class="hover:text-primary" />
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
}>()

const emit = defineEmits<{ edit: [secret: Secret], delete: [key: string], history: [secret: Secret], update: [] }>()

const visibleKeys = ref<Record<string, boolean>>({})
const copyStates = ref<Record<string, boolean>>({})
const { isOwner, isAdmin } = storeToRefs(useProjectStore())
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

function getPendingChangeType(key: string): "create" | "update" | "delete" | null {
  if (!isOwner.value(props.projectId) && !isAdmin.value(props.projectId)) {
    return null
  }

  const change = props.pendingChanges.get(key)
  return change ? change.type : null
}

function getRowClass(key: string) {
  if (getPendingChangeType(key) === "create") {
    return "bg-success/20 hover:bg-success/30!"
  }
  if (getPendingChangeType(key) === "update") {
    return "bg-secondary/20 hover:bg-secondary/30!"
  }
  if (getPendingChangeType(key) === "delete") {
    return "bg-danger/20 hover:bg-danger/30! line-through decoration-danger"
  }
}

function getSecretValueClass(key: string) {
  if (getPendingChangeType(key) === "create") {
    return "rounded-lg px-1 transition-colors hover:text-secondary! bg-success/40 group-hover:bg-success/50!"
  }
  if (getPendingChangeType(key) === "update") {
    return "rounded-lg px-1 transition-colors hover:text-secondary! bg-secondary/40 group-hover:bg-secondary/50!"
  }
  if (getPendingChangeType(key) === "delete") {
    return "rounded-lg px-1 transition-colors hover:text-secondary! bg-danger/40 group-hover:bg-danger/50!"
  }

  return "rounded-lg px-1 transition-colors group-hover:bg-card! hover:text-secondary! bg-muted"
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

function getSecretValue(key: string, env: string) {
  return props.secrets.find(s => s.key === key)?.values?.find(v => v.environment === env)?.value ?? ""
}

function renderValue(key: string, env: string) {
  const val = getSecretValue(key, env)
  return val ? (visibleKeys.value[key] ? val : "•".repeat(val.length)) : "—"
}
</script>
