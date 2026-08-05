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
          :class="isMobile ? 'flex size-full max-h-[92dvh] flex-col rounded-t-lg' : 'flex size-full max-h-none! max-w-xl flex-col rounded-none! border-0! shadow-none!'"
        >
          <div v-if="isMobile" class="h-1 w-20 self-center rounded-full bg-current opacity-20" />

          <header class="flex flex-row items-start justify-between gap-4 border-b pb-2">
            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
              <div class="navigation-group">
                <button
                  v-if="selected" type="button"
                  class="btn-ghost p-0!" aria-label="Back"
                  @click="selectedId = null"
                >
                  <icon name="ph:arrow-left-bold" size="20" />
                </button>
                <h4 id="integrations-sheet-title" class="truncate">
                  {{ sheetTitle }}
                </h4>
              </div>
              <p v-if="!selected" class="text-caption">
                {{ sheetDescription }}
              </p>
            </div>

            <button type="button" aria-label="Close" class="btn-ghost shrink-0" @mousedown="emit('update:isOpen', false)">
              <icon name="ph:x-bold" size="20" />
            </button>
          </header>

          <section class="scroll-area min-h-0 flex-1 overflow-y-auto">
            <!-- Catalog -->
            <div v-if="!selected" class="flex flex-col gap-1">
              <button
                v-for="item in INTEGRATIONS" :key="item.id"
                type="button" class="flex w-full items-center gap-2 rounded-md px-1 py-2 text-left transition-colors hover:bg-muted/40"
                @click="selectedId = item.id"
              >
                <div class="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <icon :name="item.icon" size="20" />
                </div>
                <div class="flex min-w-0 flex-1 flex-col">
                  <span class="text-sm">{{ item.name }}</span>
                  <span class="text-caption text-xs!">{{ item.summary }}</span>
                </div>
                <icon name="ph:caret-right-bold" size="15" class="shrink-0 text-muted-foreground" />
              </button>
            </div>

            <!-- Detail -->
            <div v-else class="flex flex-col gap-5">
              <header class="flex flex-col gap-1">
                <p class="text-caption">
                  {{ selected.description }}
                </p>
                <nuxt-link v-if="selected.docsUrl" :to="selected.docsUrl" target="_blank" class="navigation-group w-fit text-xs text-secondary hover:underline">
                  <span>{{ selected.docsLabel || "Documentation" }}</span>
                  <icon name="ph:arrow-up-right-bold" size="15" />
                </nuxt-link>
              </header>

              <section v-if="selected.steps?.length" class="flex flex-col gap-2">
                <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Setup
                </p>
                <ol class="flex flex-col gap-2">
                  <li v-for="(step, index) in selected.steps" :key="step.title" class="flex gap-2">
                    <span class="mt-0.5 w-4 shrink-0 text-xs text-muted-foreground tabular-nums">
                      {{ index + 1 }}.
                    </span>
                    <div class="flex min-w-0 flex-col gap-0.5">
                      <span class="text-sm">{{ step.title }}</span>
                      <span class="text-caption text-xs!">{{ step.body }}</span>
                    </div>
                  </li>
                </ol>
              </section>

              <section v-if="selected.secrets?.length" class="flex flex-col gap-2">
                <div class="flex flex-col gap-0.5">
                  <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {{ selected.secretsHeading || "Secrets" }}
                  </p>
                  <p v-if="selected.secretsHint" class="text-caption text-xs!">
                    {{ selected.secretsHint }}
                  </p>
                </div>

                <div class="flex flex-col gap-2">
                  <div v-for="secret in selected.secrets" :key="secret.name" class="flex flex-col gap-0.5">
                    <code class="text-xs">{{ secret.name }}</code>
                    <p class="text-caption text-xs!">
                      {{ secret.description }}
                    </p>
                    <div
                      v-if="resolveSecretValue(secret) || secret.placeholder"
                      class="navigation-group rounded-md border bg-muted/30 px-2 py-1.5 font-mono text-xs"
                    >
                      <span class="min-w-0 flex-1 truncate" :title="resolveSecretValue(secret) || secret.placeholder">
                        {{ resolveSecretValue(secret) || secret.placeholder }}
                      </span>
                      <button
                        v-if="resolveSecretValue(secret)" type="button"
                        class="btn-ghost shrink-0 p-0!" :aria-label="`Copy ${secret.name}`"
                        @click="copyValue(secret.name, resolveSecretValue(secret)!)"
                      >
                        <icon :name="copyIcons[secret.name]?.icon.value || 'ph:copy-bold'" size="15" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section class="flex flex-col gap-2">
                <div class="flex flex-col gap-0.5">
                  <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Service token
                  </p>
                  <p class="text-caption text-xs!">
                    {{ selected.tokenHint || "Generate a token scoped for this integration. Copy it into WINDKEEP_TOKEN." }}
                  </p>
                </div>

                <template v-if="generatedRawToken">
                  <div class="navigation-group rounded-md border bg-muted/30 px-2 py-1.5 font-mono text-xs">
                    <span class="min-w-0 flex-1 truncate select-all" :title="isTokenVisible ? generatedRawToken : undefined">
                      {{ isTokenVisible ? generatedRawToken : "••••••••••••••••••••••••••••••••" }}
                    </span>
                    <button
                      type="button" class="btn-ghost shrink-0 p-1!"
                      :aria-label="isTokenVisible ? 'Hide token' : 'Show token'" @click="isTokenVisible = !isTokenVisible"
                    >
                      <icon :name="isTokenVisible ? 'ph:eye-closed-bold' : 'ph:eye-bold'" size="20" />
                    </button>
                    <button type="button" class="btn shrink-0 p-1!" aria-label="Copy token" @click="copyValue('token', generatedRawToken)">
                      <icon :name="copyIcons.token?.icon.value || 'ph:copy-bold'" size="20" />
                    </button>
                    <button type="button" class="btn-ghost shrink-0 p-1!" aria-label="Dismiss token" @click="dismissGeneratedToken">
                      <icon name="ph:x-bold" size="20" />
                    </button>
                  </div>
                </template>

                <form v-else class="flex flex-col gap-2" @submit.prevent="handleGenerateToken">
                  <div class="flex flex-col gap-1">
                    <label for="integration-token-name" class="text-caption text-xs!">Name</label>
                    <input id="integration-token-name" v-model="tokenForm.name" type="text" :placeholder="selected.defaultTokenName || 'Integration'">
                  </div>

                  <div class="flex flex-col gap-1">
                    <span class="text-caption text-xs!">Environments</span>
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
                    <label for="integration-token-expiry" class="text-caption text-xs!">Expires in (days)</label>
                    <div class="navigation-group">
                      <input
                        id="integration-token-expiry" v-model.number="tokenForm.expiresInDays"
                        type="number" min="1"
                        max="365" placeholder="Leave empty for no expiration"
                        class="min-w-0 flex-1"
                      >
                      <button type="submit" class="btn-success shrink-0" :disabled="!canGenerateToken || !canManage">
                        <icon name="ph:key-bold" size="20" />
                        <span>Generate</span>
                      </button>
                    </div>
                  </div>

                  <p v-if="!canManage" class="text-caption text-xs! text-warning">
                    Only project owners and admins can create service tokens.
                  </p>
                </form>
              </section>

              <section v-if="snippet" class="flex flex-col gap-2">
                <div class="flex min-w-0 flex-col gap-0.5">
                  <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {{ selected.snippetHeading || "Snippet" }}
                  </p>
                  <code class="text-caption text-xs!">{{ snippet.filename }}</code>
                </div>
                <div class="relative">
                  <button type="button" class="btn absolute top-2 right-2 z-10" aria-label="Copy snippet" @click="copyValue('workflow', snippet.code)">
                    <icon :name="copyIcons.workflow?.icon.value || 'ph:copy-bold'" size="15" />
                  </button>
                  <Shiki :lang="snippet.language" :code="snippet.code" class="code-block max-h-80 overflow-auto text-xs" />
                </div>
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
const sheetDescription = computed(() => "Recipes for CI/CD and hosting platforms")
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
const isTokenVisible = ref(true)
const tokenForm = ref<{ name: string, environments: Environment[], expiresInDays: number | null }>({
  name: "Railway Deploy",
  environments: ["PRODUCTION"],
  expiresInDays: null,
})

const canGenerateToken = computed(() => tokenForm.value.name.trim().length >= 3 && tokenForm.value.environments.length > 0)

const copyIconKeys = [...new Set(INTEGRATIONS.flatMap(item => (item.secrets ?? []).map(secret => secret.name))), "token", "workflow"]
const copyIcons = Object.fromEntries(copyIconKeys.map(key => [key, useActionIcon("ph:copy-bold")])) as Record<string, ReturnType<typeof useActionIcon>>

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
  isTokenVisible.value = true
  tokenForm.value = {
    name: selected.value?.defaultTokenName || "Integration",
    environments: [...(selected.value?.defaultEnvironments || ["PRODUCTION"])],
    expiresInDays: null,
  }
}

function dismissGeneratedToken() {
  generatedRawToken.value = ""
  isTokenVisible.value = true
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
    isTokenVisible.value = true
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
