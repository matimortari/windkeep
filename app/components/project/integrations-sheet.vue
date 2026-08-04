<template>
  <teleport to="body">
    <transition :name="isMobile ? 'sheet-up' : 'sheet-right'">
      <div
        v-if="isOpen" class="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-xs"
        :class="isMobile ? 'items-end justify-center' : 'items-stretch justify-end'" @mousedown.self="emit('update:isOpen', false)"
      >
        <div
          class="overlay space-y-4" role="dialog"
          aria-modal="true" aria-labelledby="integrations-sheet-title"
          :class="isMobile ? 'flex size-full max-h-[92dvh] flex-col rounded-t-lg' : 'flex size-full max-h-none max-w-xl flex-col rounded-none border-y-0 border-r-0'"
        >
          <div v-if="isMobile" class="h-1 w-20 self-center rounded-full bg-current opacity-20" />

          <header class="flex flex-row items-start justify-between gap-4 border-b pb-2">
            <div class="flex min-w-0 flex-1 flex-col gap-1">
              <div v-if="selected" class="navigation-group">
                <button type="button" class="btn-ghost p-0!" aria-label="Back" @click="selectedId = null">
                  <icon name="ph:arrow-left-bold" size="20" />
                </button>
                <h4 id="integrations-sheet-title" class="truncate">
                  {{ sheetTitle }}
                </h4>
              </div>
              <p class="text-caption">
                {{ sheetDescription }}
              </p>
            </div>

            <button type="button" aria-label="Close" class="btn-ghost shrink-0" @mousedown="emit('update:isOpen', false)">
              <icon name="ph:x-bold" size="20" />
            </button>
          </header>

          <section class="scroll-area min-h-0 flex-1 overflow-y-auto">
            <!-- Catalog -->
            <div v-if="!selected" class="flex flex-col gap-2">
              <p class="text-caption px-1">
                Connect WindKeep to your deploy and CI tools. Start with a recipe, generate a service token, and copy the workflow.
              </p>

              <button
                v-for="item in INTEGRATIONS" :key="item.id"
                type="button" class="flex w-full items-start gap-2 rounded-md border p-2 text-left transition-colors"
                @click="selectedId = item.id"
              >
                <div class="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <icon :name="item.icon" size="20" />
                </div>
                <div class="flex min-w-0 flex-1 flex-col">
                  <span class="font-semibold">{{ item.name }}</span>
                  <span class="text-caption">{{ item.summary }}</span>
                </div>
                <icon name="ph:caret-right-bold" size="15" class="mt-1 shrink-0 text-muted-foreground" />
              </button>
            </div>

            <!-- Detail -->
            <div v-else class="flex flex-col gap-4">
              <header class="flex items-start gap-2">
                <div class="flex size-12 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <icon :name="selected.icon" size="30" />
                </div>
                <div class="flex flex-col gap-1">
                  <p class="text-sm text-muted-foreground">
                    {{ selected.description }}
                  </p>
                  <nuxt-link v-if="selected.docsUrl" :to="selected.docsUrl" target="_blank" class="navigation-group text-xs text-secondary hover:underline">
                    <span>{{ selected.docsLabel || "Documentation" }}</span>
                    <icon name="ph:arrow-up-right-bold" size="15" />
                  </nuxt-link>
                </div>
              </header>

              <section v-if="selected.steps?.length" class="flex flex-col gap-2">
                <h6>
                  Setup steps
                </h6>
                <ol class="flex flex-col gap-2">
                  <li v-for="(step, index) in selected.steps" :key="step.title" class="flex gap-2">
                    <span class="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                      {{ index + 1 }}
                    </span>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-sm font-semibold">{{ step.title }}</span>
                      <span class="text-caption">{{ step.body }}</span>
                    </div>
                  </li>
                </ol>
              </section>

              <section v-if="selected.secrets?.length" class="flex flex-col gap-2">
                <header class="flex flex-col gap-1">
                  <h6>
                    {{ selected.secretsHeading || "Required secrets" }}
                  </h6>
                  <p v-if="selected.secretsHint" class="text-caption">
                    {{ selected.secretsHint }}
                  </p>
                </header>

                <div class="flex flex-col gap-2">
                  <div v-for="secret in selected.secrets" :key="secret.name" class="flex flex-col gap-2 rounded-md border p-3">
                    <div class="navigation-group justify-between">
                      <code class="text-xs font-semibold">{{ secret.name }}</code>
                      <button
                        v-if="resolveSecretValue(secret)" type="button"
                        class="btn-ghost p-0!" :aria-label="`Copy ${secret.name}`"
                        @click="copyValue(secret.name, resolveSecretValue(secret)!)"
                      >
                        <icon :name="copyIcons[secret.name]?.icon.value || 'ph:copy-bold'" size="15" />
                      </button>
                    </div>
                    <p class="text-caption">
                      {{ secret.description }}
                    </p>
                    <div v-if="resolveSecretValue(secret) || secret.placeholder" class="rounded-sm border bg-muted/40 px-2 py-1.5 font-mono text-xs break-all text-muted-foreground">
                      {{ resolveSecretValue(secret) || secret.placeholder }}
                    </div>
                  </div>
                </div>
              </section>

              <section class="flex flex-col gap-2">
                <header class="flex flex-col gap-1">
                  <h6>
                    Service token
                  </h6>
                  <p class="text-caption">
                    {{ selected.tokenHint || "Generate a token scoped for this integration. Copy it into WINDKEEP_TOKEN." }}
                  </p>
                </header>

                <template v-if="generatedRawToken">
                  <div class="flex flex-col gap-2 rounded-md border border-success/40 bg-success/5 p-3">
                    <p class="text-sm font-semibold text-success">
                      Token generated — copy it now. It will not be shown again.
                    </p>
                    <div class="navigation-group rounded-sm border bg-muted p-3 font-mono text-xs break-all">
                      <span class="flex-1">{{ generatedRawToken }}</span>
                      <button type="button" class="btn shrink-0" aria-label="Copy token" @click="copyValue('token', generatedRawToken)">
                        <icon :name="copyIcons.token?.icon.value || 'ph:copy-bold'" size="20" />
                      </button>
                    </div>
                  </div>
                </template>

                <form v-else class="flex flex-col gap-2 rounded-md border p-3" @submit.prevent="handleGenerateToken">
                  <div class="flex flex-col gap-1">
                    <label for="integration-token-name" class="text-sm font-semibold">Name</label>
                    <input id="integration-token-name" v-model="tokenForm.name" type="text" :placeholder="selected.defaultTokenName || 'Integration'">
                  </div>

                  <div class="flex flex-col gap-1">
                    <span class="text-sm font-semibold">Environments</span>
                    <span class="text-xs text-muted-foreground">Only values from selected environments are returned by this token.</span>
                    <div class="navigation-group flex-wrap">
                      <button
                        v-for="env in ENVIRONMENTS" :key="env.value"
                        type="button" :class="tokenForm.environments.includes(env.value) ? 'border-secondary! text-secondary!' : ''"
                        class="btn-ghost" @click="toggleEnvironment(env.value)"
                      >
                        {{ env.label }}
                      </button>
                    </div>
                  </div>

                  <div class="flex flex-col gap-1">
                    <label for="integration-token-expiry" class="text-sm font-semibold">Expires in (days)</label>
                    <input
                      id="integration-token-expiry" v-model.number="tokenForm.expiresInDays"
                      type="number" min="1"
                      max="365" placeholder="Leave empty for no expiration"
                    >
                  </div>

                  <button type="submit" class="btn-success self-end" :disabled="!canGenerateToken || !canManage">
                    <icon name="ph:key-bold" size="20" />
                    <span>Generate token</span>
                  </button>
                  <p v-if="!canManage" class="text-caption text-warning">
                    Only project owners and admins can create service tokens.
                  </p>
                </form>
              </section>

              <section v-if="snippet" class="flex flex-col gap-2">
                <header class="navigation-group justify-between">
                  <div class="flex flex-col gap-1">
                    <h6>
                      {{ selected.snippetHeading || "Snippet" }}
                    </h6>
                    <p class="text-caption">
                      <code>{{ snippet.filename }}</code>
                    </p>
                  </div>
                  <button type="button" class="btn-secondary" aria-label="Copy snippet" @click="copyValue('workflow', snippet.code)">
                    <icon :name="copyIcons.workflow?.icon.value || 'ph:copy-bold'" size="20" />
                    <span>Copy</span>
                  </button>
                </header>
                <Shiki :lang="snippet.language" :code="snippet.code" class="code-block max-h-80 overflow-auto text-xs" />
              </section>
            </div>
          </section>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  projectId: string
  projectSlug: string
  canManage: boolean
}>()

const emit = defineEmits<{ "update:isOpen": [value: boolean], "tokenCreated": [] }>()

const { public: { baseURL } } = useRuntimeConfig()
const projectStore = useProjectStore()
const selectedId = ref<string | null>(null)
const selected = computed(() => selectedId.value ? INTEGRATIONS.find(item => item.id === selectedId.value) ?? null : null)
const sheetTitle = computed(() => selected.value?.name ?? "Integrations")
const sheetDescription = computed(() => selected.value ? selected.value.summary : "Recipes for CI/CD and hosting platforms")
const isMobile = ref(false)
const mediaQueryAbort = new AbortController()

const snippet = computed(() => {
  if (!selected.value?.buildSnippet || !props.projectId) {
    return null
  }
  return selected.value.buildSnippet({
    baseURL: (baseURL as string)?.replace(/\/$/, "") || "",
    projectId: props.projectId,
    projectSlug: props.projectSlug,
  })
})

const generatedRawToken = ref("")
const tokenForm = ref<{ name: string, environments: Environment[], expiresInDays: number | null }>({
  name: "Railway Deploy",
  environments: ["PRODUCTION"],
  expiresInDays: null,
})

const canGenerateToken = computed(() => tokenForm.value.name.trim().length >= 3 && tokenForm.value.environments.length > 0)

const copyIconKeys = [
  ...new Set(INTEGRATIONS.flatMap(item => (item.secrets ?? []).map(secret => secret.name))),
  "token",
  "workflow",
]
const copyIcons = Object.fromEntries(
  copyIconKeys.map(key => [key, useActionIcon("ph:copy-bold")]),
) as Record<string, ReturnType<typeof useActionIcon>>

function resolveSecretValue(secret: { source?: "baseURL" | "projectId" | "serviceToken", placeholder?: string }) {
  if (secret.source === "baseURL") {
    return (baseURL as string)?.replace(/\/$/, "") || ""
  }
  if (secret.source === "projectId") {
    return props.projectId
  }
  if (secret.source === "serviceToken") {
    return generatedRawToken.value || ""
  }
  return ""
}

async function copyValue(key: string, value: string) {
  await copyIcons[key]?.triggerCopy(value)
}

function toggleEnvironment(env: Environment) {
  const idx = tokenForm.value.environments.indexOf(env)
  if (idx === -1) {
    tokenForm.value.environments.push(env)
  }
  else {
    tokenForm.value.environments.splice(idx, 1)
  }
}

function resetTokenForm() {
  generatedRawToken.value = ""
  tokenForm.value = {
    name: selected.value?.defaultTokenName || "Integration",
    environments: [...(selected.value?.defaultEnvironments || ["PRODUCTION"])],
    expiresInDays: null,
  }
}

async function handleGenerateToken() {
  if (!props.projectId || !canGenerateToken.value || !props.canManage) {
    return
  }

  const daysValue = tokenForm.value.expiresInDays
  const res = await projectStore.createProjectServiceToken(props.projectId, {
    name: tokenForm.value.name.trim(),
    environment: tokenForm.value.environments.map(env => env.toUpperCase() as Environment),
    expiresInDays: daysValue && Number(daysValue) > 0 ? Number(daysValue) : undefined,
  })

  if (res?.rawToken) {
    generatedRawToken.value = res.rawToken
    emit("tokenCreated")
  }
}

function onEscape(e: KeyboardEvent) {
  if (e.key === "Escape" && props.isOpen) {
    emit("update:isOpen", false)
  }
}

function scrollLock(locked: boolean) {
  const val = locked ? "hidden" : ""
  document.documentElement.style.overflow = val
  document.body.style.overflow = val
}

watch(() => props.isOpen, (open) => {
  scrollLock(open)
  if (open) {
    selectedId.value = null
    resetTokenForm()
  }
})

watch(selectedId, () => resetTokenForm())

onMounted(() => {
  const mql = globalThis.matchMedia("(max-width: 767px)")
  isMobile.value = mql.matches
  mql.addEventListener("change", e => isMobile.value = e.matches, { signal: mediaQueryAbort.signal })
  document.addEventListener("keydown", onEscape)
  if (props.isOpen) {
    scrollLock(true)
  }
})

onBeforeUnmount(() => {
  mediaQueryAbort.abort()
  document.removeEventListener("keydown", onEscape)
  scrollLock(false)
})
</script>

<style scoped>
.sheet-right-enter-active,
.sheet-right-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard);
}
.sheet-right-enter-active > .overlay,
.sheet-right-leave-active > .overlay {
  transition: transform var(--duration-slow) var(--ease-emphasized);
}
.sheet-right-enter-from,
.sheet-right-leave-to {
  opacity: 0;
}
.sheet-right-enter-from > .overlay {
  transform: translateX(100%);
}
.sheet-right-leave-to > .overlay {
  transform: translateX(100%);
}

.sheet-up-enter-active,
.sheet-up-leave-active {
  transition:
    opacity var(--duration-base) var(--ease-standard),
    transform var(--duration-slow) var(--ease-emphasized);
}
.sheet-up-enter-from,
.sheet-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
