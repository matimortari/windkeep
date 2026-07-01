<template>
  <TabSection title="Service Tokens" description="Manage programmatic access keys for CI/CD pipelines and backend deployments.">
    <ul class="scroll-area card flex max-h-64 flex-col items-start overflow-y-auto">
      <li v-if="!serviceTokens.length" class="w-full py-4 text-center text-sm text-muted-foreground">
        No service tokens generated yet for this project.
      </li>
      <li v-for="token in serviceTokens" :key="token.id" class="navigation-group w-full justify-between border-y py-2 first:border-t-0 first:pt-0 last:border-b-0 last:pb-0">
        <div class="flex flex-col gap-1 truncate">
          <span class="font-semibold">{{ token.name }}</span>
          <div class="navigation-group flex-wrap">
            <span v-for="env in token.environment" :key="env" class="rounded-sm bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
              {{ ENVIRONMENTS.find(e => e.value === env)?.label }}
            </span>
          </div>
          <div class="navigation-group text-xs text-muted-foreground">
            <span>Expires: {{ token.expiresAt ? formatDate(token.expiresAt) : 'Never' }}</span>
            <span>Last used: {{ token.lastUsedAt ? formatDate(token.lastUsedAt) : 'Never' }}</span>
            <span>By: {{ token.user?.name }}</span>
          </div>
        </div>

        <button class="btn shrink-0" aria-label="Revoke Token" @click="handleRevokeToken(token.id)">
          <icon name="ph:trash-bold" size="16" class="text-muted-foreground hover:text-danger" />
        </button>
      </li>
    </ul>

    <!-- Accordion create form -->
    <div class="flex flex-col gap-2">
      <button class="btn-primary self-end" @click="toggleCreateForm">
        <icon :name="showCreateForm ? 'ph:x-bold' : 'ph:key-bold'" size="18" />
        <span>{{ showCreateForm ? 'Cancel' : 'Generate Token' }}</span>
      </button>

      <transition name="accordion">
        <div v-if="showCreateForm" class="card flex flex-col gap-4 border p-4">
          <!-- Raw token reveal -->
          <template v-if="generatedRawToken">
            <div class="flex flex-col gap-2">
              <p class="text-sm font-semibold text-success">
                Token generated successfully
              </p>
              <p class="text-caption">
                Copy this token now. <strong>You will not be able to see it again.</strong>
              </p>
              <div class="navigation-group rounded-sm border bg-muted p-3 font-mono text-xs break-all">
                <span class="flex-1">{{ generatedRawToken }}</span>
                <button class="btn ml-2 shrink-0" aria-label="Copy token" @click="copyToken">
                  <icon :name="tokenCopyIcon.icon.value" size="18" />
                </button>
              </div>
              <button class="btn self-end" @click="dismissToken">
                I've saved this token securely
              </button>
            </div>
          </template>

          <!-- Create form -->
          <template v-else>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold">Name</label>
              <input v-model="tokenForm.name" type="text" placeholder="e.g. GitHub Actions, Vercel Deploy">
              <span class="text-xs text-muted-foreground">A descriptive name to identify this token.</span>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold">Environments</label>
              <div class="navigation-group flex-wrap">
                <button
                  v-for="env in ENVIRONMENTS" :key="env.value"
                  class="btn-ghost" :class="tokenForm.environments.includes(env.value as Environment) ? 'border-secondary! text-secondary!' : ''"
                  @click="toggleEnvironment(env.value as Environment)"
                >
                  {{ env.label }}
                </button>
              </div>
              <span class="text-xs text-muted-foreground">Token will only be able to read secrets from selected environments.</span>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold">Expires in (days)</label>
              <input
                v-model.number="tokenForm.expiresInDays" type="number"
                min="1" max="365"
                placeholder="Leave empty for no expiration" class="md:max-w-64"
              >
              <span class="text-xs text-muted-foreground">Optional. Maximum 365 days.</span>
            </div>

            <div class="flex justify-end">
              <button class="btn-success" :disabled="!canSubmitToken" @click="handleCreateToken">
                <icon name="ph:key-bold" size="18" />
                <span>Generate</span>
              </button>
            </div>
          </template>
        </div>
      </transition>
    </div>
  </TabSection>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.project
const { createActionHandler } = useActionIcon()
const projectStore = useProjectStore()
const { projects, serviceTokens } = storeToRefs(projectStore)
const project = computed(() => projects.value.find(p => p.slug === slug))
const showCreateForm = ref(false)
const generatedRawToken = ref("")
const tokenForm = ref<{ name: string, environments: Environment[], expiresInDays: number | null }>({
  name: "",
  environments: [],
  expiresInDays: null,
})
const canSubmitToken = computed(() => tokenForm.value.name.trim().length >= 3 && tokenForm.value.environments.length > 0)
const tokenCopyIcon = createActionHandler("ph:copy-bold")

function toggleCreateForm() {
  showCreateForm.value = !showCreateForm.value
  if (!showCreateForm.value) {
    resetTokenForm()
  }
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
  tokenForm.value = { name: "", environments: [], expiresInDays: null }
  generatedRawToken.value = ""
}

async function copyToken() {
  await tokenCopyIcon.triggerCopy(generatedRawToken.value)
}

function dismissToken() {
  showCreateForm.value = false
  resetTokenForm()
}

async function handleCreateToken() {
  if (!project.value?.id || !canSubmitToken.value) {
    return
  }

  const daysValue = tokenForm.value.expiresInDays
  const res = await projectStore.createProjectServiceToken(project.value.id, {
    name: tokenForm.value.name.trim(),
    environment: tokenForm.value.environments.map(env => env.toUpperCase() as Environment),
    expiresInDays: daysValue && Number(daysValue) > 0 ? Number(daysValue) : undefined,
  })
  if (res?.rawToken) {
    generatedRawToken.value = res.rawToken
  }
}

async function handleRevokeToken(tokenId: string) {
  if (!confirm("Are you sure you want to revoke this service token? Any system using it will lose access immediately.")) {
    return
  }
  await projectStore.revokeProjectServiceToken(project.value?.id ?? "", tokenId)
}

watch(() => project.value?.id, async (id) => {
  if (!id) {
    return
  }
  await projectStore.getProjectServiceTokens(id)
}, { immediate: true })
</script>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
