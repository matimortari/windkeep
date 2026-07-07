<template>
  <TabSection title="Service Tokens">
    <template #context>
      <h3 class="navigation-group max-w-lg truncate text-muted-foreground">
        <span class="truncate">{{ project?.name }}</span>
        <nuxt-link v-if="project?.website" :href="project.website" target="_blank" aria-label="Visit project website">
          <icon name="ph:arrow-up-right-bold" size="15" class="hover:text-primary" />
        </nuxt-link>
      </h3>
    </template>

    <div class="p-2">
      <ul class="scroll-area card flex max-h-64 flex-col items-start divide-y overflow-y-auto">
        <li v-if="!serviceTokens.length" class="w-full py-4 text-center text-sm text-muted-foreground">
          No service tokens generated yet for this project.
        </li>
        <li v-for="token in serviceTokens" :key="token.id" class="navigation-group w-full justify-between py-4 first:pt-0 last:pb-0">
          <div class="flex flex-col gap-1 truncate">
            <div class="navigation-group flex-wrap">
              <span class="font-semibold">{{ token.name }}</span>
              <span v-for="env in token.environment" :key="env" class="rounded-sm bg-muted/50 px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
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
            <icon name="ph:trash-bold" size="15" class="text-muted-foreground hover:text-danger" />
          </button>
        </li>
      </ul>
    </div>

    <section class="flex flex-col gap-4 border-t py-4" aria-label="Generate service token">
      <header class="flex flex-col gap-1">
        <h6>
          Generate Token
        </h6>
        <p class="text-caption">
          Create a service token for CI/CD pipelines or external tools. Tokens can only read secrets from selected environments.
        </p>
      </header>

      <div class="card flex flex-col gap-4">
        <template v-if="generatedRawToken">
          <div class="flex flex-col gap-2">
            <h6 class="text-success">
              Token generated successfully
            </h6>
            <p class="text-caption">
              Copy this token now. <strong>You will not be able to see it again.</strong>
            </p>
            <div class="navigation-group rounded-sm border bg-muted p-4 font-mono text-xs break-all">
              <span class="flex-1">{{ generatedRawToken }}</span>
              <button class="btn shrink-0" aria-label="Copy token" @click="copyToken">
                <icon :name="tokenCopyIcon.icon.value" size="20" />
              </button>
            </div>
            <button class="btn self-end" @click="dismissToken">
              I've saved this token securely
            </button>
          </div>
        </template>

        <template v-else>
          <div class="flex flex-col gap-1">
            <h6>
              Name
            </h6>
            <p class="text-caption">
              A descriptive name to identify this token.
            </p>
            <input v-model="tokenForm.name" type="text" class="w-full md:max-w-64" placeholder="e.g. GitHub Actions, Vercel Deploy">
          </div>

          <div class="flex flex-col gap-1">
            <h6>
              Environments
            </h6>
            <p class="text-caption">
              Token will only be able to read secrets from selected environments.
            </p>
            <div class="navigation-group flex-wrap">
              <button
                v-for="env in ENVIRONMENTS" :key="env.value"
                class="btn-ghost" :class="tokenForm.environments.includes(env.value as Environment) ? 'border-secondary! text-secondary!' : ''"
                @click="toggleEnvironment(env.value as Environment)"
              >
                {{ env.label }}
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <h6>
              Expires in (days)
            </h6>
            <p class="text-caption">
              Optional. Maximum 365 days.
            </p>
            <input
              v-model.number="tokenForm.expiresInDays" type="number"
              min="1" max="365"
              placeholder="Leave empty for no expiration" class="w-full md:max-w-64"
            >
          </div>

          <div class="flex justify-end">
            <button class="btn-success" :disabled="!canSubmitToken" @click="handleCreateToken">
              <icon name="ph:key-bold" size="20" />
              <span>Generate</span>
            </button>
          </div>
        </template>
      </div>
    </section>
  </TabSection>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.project
const { createActionHandler } = useActionIcon()
const projectStore = useProjectStore()
const { projects, serviceTokens } = storeToRefs(projectStore)
const project = computed(() => projects.value.find(p => p.slug === slug))
const generatedRawToken = ref("")
const tokenForm = ref<{ name: string, environments: Environment[], expiresInDays: number | null }>({
  name: "",
  environments: [],
  expiresInDays: null,
})

const canSubmitToken = computed(() => tokenForm.value.name.trim().length >= 3 && tokenForm.value.environments.length > 0)
const tokenCopyIcon = createActionHandler("ph:copy-bold")

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
