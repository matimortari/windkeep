<template>
  <teleport to="body">
    <transition :name="isMobile ? 'sheet-up' : 'sheet-right'">
      <div
        v-if="isOpen" class="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-xs"
        :class="isMobile ? 'items-end justify-center' : 'items-stretch justify-end p-4'" @mousedown.self="emit('update:isOpen', false)"
      >
        <div
          class="overlay min-w-0 space-y-4 overflow-x-hidden" role="dialog"
          aria-modal="true" aria-labelledby="integrations-sheet-title"
          :class="isMobile ? 'flex max-h-[92dvh] w-full max-w-full flex-col rounded-t-lg' : 'flex size-full max-h-none! max-w-3xl flex-col rounded-2xl! border shadow-sm'"
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
              <p class="text-caption pt-2">
                {{ sheetDescription }}
              </p>
            </div>

            <button type="button" aria-label="Close" class="btn-ghost shrink-0 p-2!" @mousedown="emit('update:isOpen', false)">
              <icon name="ph:x-bold" size="20" />
            </button>
          </header>

          <section class="scroll-area min-h-0 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto pr-4">
            <!-- Catalog -->
            <div v-if="!selected" class="flex flex-col gap-2 p-1">
              <button
                v-for="item in INTEGRATIONS" :key="item.id"
                type="button" class="flex w-full items-center gap-2.5 rounded-md p-2.5 text-left transition-colors hover:bg-muted/40"
                @click="selectedId = item.id"
              >
                <div class="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                  <icon :name="item.icon" size="25" />
                </div>
                <div class="flex min-w-0 flex-1 flex-col">
                  <span class="text-sm font-medium">{{ item.name }}</span>
                  <span class="text-caption">{{ item.summary }}</span>
                </div>
                <icon name="ph:caret-right-bold" size="20" class="shrink-0 text-muted-foreground" />
              </button>
            </div>

            <!-- Detail -->
            <div v-else class="flex w-full min-w-0 flex-col divide-y">
              <p class="text-caption pb-4">
                {{ selected.description }}
                <nuxt-link v-if="selected.docsUrl" :to="selected.docsUrl" target="_blank" class="ml-1 inline-flex items-center gap-0.5 text-secondary hover:underline">
                  <span>{{ selected.docsLabel }}</span>
                  <icon name="ph:arrow-up-right-bold" size="15" />
                </nuxt-link>
              </p>

              <details v-if="selected.steps?.length" class="group py-4" open>
                <summary class="text-caption flex cursor-pointer list-none items-center gap-1 tracking-wider uppercase">
                  <icon name="ph:caret-right-bold" size="15" class="shrink-0 transition-transform group-open:rotate-90" />
                  Setup
                </summary>
                <ol class="mt-2 flex flex-col gap-2">
                  <li v-for="(step, index) in selected.steps" :key="step.title" class="flex gap-2">
                    <span class="text-caption w-4 shrink-0 tabular-nums">
                      {{ index + 1 }}.
                    </span>
                    <div class="min-w-0 text-sm">
                      <p class="font-medium">
                        {{ step.title }}.
                      </p>
                      <p class="text-muted-foreground">
                        {{ step.body }}
                      </p>
                    </div>
                  </li>
                </ol>
              </details>

              <details v-if="selected.secrets?.length" class="group py-4" open>
                <summary class="text-caption flex cursor-pointer list-none items-center gap-1 tracking-wider uppercase">
                  <icon name="ph:caret-right-bold" size="15" class="shrink-0 transition-transform group-open:rotate-90" />
                  {{ selected.secretsHeading }}
                </summary>
                <p v-if="selected.secretsHint" class="mt-2 text-xs text-muted-foreground">
                  {{ selected.secretsHint }}
                </p>

                <div class="mt-4 flex min-w-0 flex-col gap-4 rounded-md border bg-muted/30 p-4">
                  <div v-for="(secret, index) in selected.secrets" :key="secret.name" class="flex min-w-0 flex-col gap-0.5">
                    <div class="relative navigation-group min-w-0">
                      <span class="min-w-0 truncate font-mono text-sm font-medium"><span class="opacity-70">{{ index + 1 }}.</span> {{ secret.name }}</span>
                      <span
                        v-if="secret.description" class="peer/tip shrink-0 cursor-pointer text-muted-foreground"
                        :aria-expanded="openTooltipKey === `secret-${secret.name}`" @click.stop="toggleTooltip(`secret-${secret.name}`, $event)"
                      >
                        <icon name="ph:info-bold" size="15" />
                      </span>
                      <span
                        v-if="secret.description" class="card pointer-events-none absolute bottom-full left-0 z-10 w-max max-w-full p-1! text-xs! font-normal! tracking-normal! text-foreground! normal-case! opacity-0 transition-opacity peer-hover/tip:opacity-100"
                        :class="openTooltipKey === `secret-${secret.name}` ? 'opacity-100!' : ''"
                      >{{ secret.description }}</span>
                      <button
                        v-if="resolveSecretValue(secret)" type="button"
                        class="shrink-0 cursor-pointer text-muted-foreground" :aria-label="`Copy ${secret.name}`"
                        @click="copyValue(secret.name, resolveSecretValue(secret)!)"
                      >
                        <icon :name="copyIcons[secret.name]?.icon.value || 'ph:copy-bold'" size="15" />
                      </button>
                    </div>
                    <span v-if="resolveSecretValue(secret) || secret.placeholder" class="text-caption min-w-0 truncate" :class="secret.instruction && !resolveSecretValue(secret) ? '' : 'font-mono!'" :title="resolveSecretValue(secret) || secret.placeholder">
                      {{ resolveSecretValue(secret) || secret.placeholder }}
                    </span>
                  </div>
                </div>

                <div class="mt-4 flex flex-col gap-2">
                  <button type="button" class="btn-secondary w-fit" :disabled="!canManage" @click="isSecretsDialogOpen = true">
                    <icon name="ph:plus-bold" size="20" />
                    <span>Create secrets in project</span>
                  </button>
                  <p v-if="!canManage" class="text-caption text-xs! text-warning">
                    Only project owners and admins can create secrets and service tokens.
                  </p>
                </div>
              </details>

              <details v-if="snippet" class="group py-4">
                <summary class="text-caption relative flex cursor-pointer list-none items-center gap-1 tracking-wider uppercase">
                  <icon name="ph:caret-right-bold" size="15" class="shrink-0 transition-transform group-open:rotate-90" />
                  {{ selected.snippetHeading || "Snippet" }}
                  <code class="text-caption text-xs! font-normal! tracking-normal! normal-case!">{{ snippet.filename }}</code>
                  <span
                    class="peer/tip shrink-0 cursor-pointer text-muted-foreground"
                    :aria-expanded="openTooltipKey === 'snippet'"
                    @click.stop="toggleTooltip('snippet', $event)"
                  >
                    <icon name="ph:info-bold" size="15" />
                  </span>
                  <span
                    class="card pointer-events-none absolute bottom-full left-0 z-10 w-max max-w-full p-1! text-xs! font-normal! tracking-normal! text-foreground! normal-case! opacity-0 transition-opacity peer-hover/tip:opacity-100"
                    :class="openTooltipKey === 'snippet' ? 'opacity-100!' : ''"
                  >
                    {{ selected.snippetHint || "Copy this file into your repository." }}
                  </span>
                </summary>
                <div class="relative mt-2 max-w-full min-w-0">
                  <button type="button" class="btn absolute top-2 right-2 z-10" aria-label="Copy snippet" @click="copyValue('workflow', snippet.code)">
                    <icon :name="copyIcons.workflow?.icon.value || 'ph:copy-bold'" size="15" />
                  </button>
                  <Shiki :lang="snippet.language" :code="snippet.code" class="code-block max-h-80 max-w-full min-w-0 overflow-auto text-xs" />
                </div>
              </details>
            </div>
          </section>
        </div>
      </div>
    </transition>
  </teleport>

  <ProjectIntegrationSecretsDialog v-model:is-open="isSecretsDialogOpen" :project-id="projectId" :integration="selected" @token-created="handleTokenCreated" />
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
const selectedId = ref<string | null>(null)
const selected = computed(() => selectedId.value ? INTEGRATIONS.find(item => item.id === selectedId.value) ?? null : null)
const sheetTitle = computed(() => selected.value?.name ?? "Integrations")
const sheetDescription = computed(() => selected.value?.summary ?? "Recipes for CI/CD and hosting platforms")
const isMobile = ref(false)
const mediaQueryAbort = new AbortController()
const openTooltipKey = ref<string | null>(null)
const openTooltipEl = ref<HTMLElement | null>(null)
const generatedRawToken = ref("")
const isSecretsDialogOpen = ref(false)
const copyIconKeys = [...new Set(INTEGRATIONS.flatMap(item => (item.secrets ?? []).map(secret => secret.name))), "workflow"]
const copyIcons = Object.fromEntries(copyIconKeys.map(key => [key, useActionIcon("ph:copy-bold")])) as Record<string, ReturnType<typeof useActionIcon>>
useClickOutside(openTooltipEl, () => {
  openTooltipKey.value = null
  openTooltipEl.value = null
}, { escapeKey: true })

const snippet = computed(() => {
  if (!selected.value?.buildSnippet || !props.projectId) {
    return null
  }
  return selected.value.buildSnippet({ baseURL: (baseURL as string)?.replace(/\/$/, "") || "", projectId: props.projectId, projectSlug: props.projectSlug })
})

function handleTokenCreated(rawToken: string) {
  generatedRawToken.value = rawToken
  emit("tokenCreated")
}

function toggleTooltip(key: string, event: MouseEvent) {
  if (openTooltipKey.value === key) {
    openTooltipKey.value = null
    openTooltipEl.value = null
    return
  }

  openTooltipKey.value = key
  openTooltipEl.value = event.currentTarget as HTMLElement
}

function resolveSecretValue(secret: { source?: "projectId" | "serviceToken" | "environment", placeholder?: string }) {
  if (secret.source === "projectId") {
    return props.projectId
  }
  if (secret.source === "serviceToken") {
    return generatedRawToken.value || ""
  }
  if (secret.source === "environment") {
    return selected.value?.defaultEnvironments?.[0] || secret.placeholder || "PRODUCTION"
  }
  return ""
}

async function copyValue(key: string, value: string) {
  await copyIcons[key]?.triggerCopy(value)
}

function onEscape(e: KeyboardEvent) {
  if (e.key === "Escape" && props.isOpen && !isSecretsDialogOpen.value) {
    emit("update:isOpen", false)
  }
}

function scrollLock(locked: boolean) {
  const val = locked ? "hidden" : ""
  document.documentElement.style.overflow = val
  document.body.style.overflow = val
}

onMounted(() => {
  const mql = globalThis.matchMedia("(max-width: 767px)")
  isMobile.value = mql.matches
  mql.addEventListener("change", e => isMobile.value = e.matches, { signal: mediaQueryAbort.signal })
  document.addEventListener("keydown", onEscape)
  if (props.isOpen) {
    scrollLock(true)
  }
})

// Lock page scroll and return to the catalog when the sheet opens
watch(() => props.isOpen, (open) => {
  scrollLock(open)
  openTooltipKey.value = null
  openTooltipEl.value = null
  if (open) {
    selectedId.value = null
    generatedRawToken.value = ""
  }
})

// Clear tooltips and the generated token when switching integrations
watch(selectedId, () => {
  openTooltipKey.value = null
  openTooltipEl.value = null
  generatedRawToken.value = ""
})

// The dialog unlocks page scroll on close; restore it while the sheet stays open
watch(isSecretsDialogOpen, (open) => {
  if (!open && props.isOpen) {
    scrollLock(true)
  }
}, { flush: "post" })

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
