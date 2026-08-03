const PREVIEW_CONFIG = {
  added: { icon: "ph:plus-bold", class: "bg-success/10 text-success" },
  updated: { icon: "ph:pencil-bold", class: "bg-warning/10 text-warning" },
  removed: { icon: "ph:minus-bold", class: "bg-danger/10 text-danger" },
} as const

export function parseEnv(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (!match) {
      continue
    }

    const key = match[1]?.trim() ?? ""
    let value = match[2]?.trim() ?? ""
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    const normalizedKey = normalizeKey(key)
    if (normalizedKey) {
      result[normalizedKey] = value
    }
  }

  return result
}

export function formatEnvText(values: Record<string, string>): string {
  return Object.entries(values).map(([key, value]) => `${key}=${value}`).join("\n")
}

/**
 * Merges incoming .env keys into existing text.
 * Incoming keys win on conflict, missing keys are kept.
 */
export function mergeEnvText(existing: string, incoming: string): string {
  return formatEnvText({ ...parseEnv(existing), ...parseEnv(incoming) })
}

export function getEnvValues(secrets: Secret[], env: Environment): Record<string, string> {
  const result: Record<string, string> = {}
  for (const secret of secrets) {
    const val = secret.values?.find(v => v.environment === env)?.value
    if (val !== undefined) {
      result[secret.key] = val
    }
  }
  return result
}

export function buildEnvText(secrets: Secret[], env: Environment): string {
  return formatEnvText(getEnvValues(secrets, env))
}

export function mergeSecretValues(baseValues: SecretValue[] | undefined, newValues: SecretValue[] | undefined): SecretValue[] {
  const mergedValues = [...(baseValues || [])]
  for (const newValue of newValues || []) {
    const idx = mergedValues.findIndex(v => v.environment === newValue.environment)
    if (idx >= 0) {
      mergedValues[idx] = newValue as SecretValue
    }
    else {
      mergedValues.push(newValue as SecretValue)
    }
  }
  return mergedValues
}

export function buildEnvPreview(current: Record<string, string>, next: Record<string, string>): EnvPreviewItem[] {
  const items: EnvPreviewItem[] = []
  for (const [key, value] of Object.entries(next)) {
    if (!value) {
      continue
    }

    if (!(key in current)) {
      items.push({ key, value, type: "added", ...PREVIEW_CONFIG.added })
    }
    else if (current[key] !== value) {
      items.push({ key, value, type: "updated", ...PREVIEW_CONFIG.updated })
    }
  }

  for (const key of Object.keys(current)) {
    if (!(key in next)) {
      items.push({ key, type: "removed", ...PREVIEW_CONFIG.removed })
    }
  }

  return items
}

export function buildSecretChangesFromEnv(projectId: string, secrets: Secret[], env: Environment, nextValues: Record<string, string>): { upserted: Secret[], removed: { key: string, environment: Environment }[] } {
  const current = getEnvValues(secrets, env)

  const upserted = Object.entries(nextValues).filter(([key, value]) => {
    if (!value) {
      return false
    }

    return current[key] === undefined || current[key] !== value
  }).map(([key, value]) => {
    const existingSecret = secrets.find(s => s.key === key)
    const existingValues = existingSecret?.values ?? []
    const mergedValues = [...existingValues.filter(v => v.environment !== env).map(v => ({ environment: v.environment, value: v.value })), { environment: env, value }]

    return {
      key,
      description: existingSecret?.description ?? "",
      projectId,
      values: mergedValues,
    } as Secret
  })

  const removed = Object.keys(current).filter(key => !(key in nextValues)).map(key => ({ key, environment: env }))

  return { upserted, removed }
}

export function useEnvEditor(options: { secrets: MaybeRefOrGetter<Secret[]>, projectId: MaybeRefOrGetter<string> }) {
  const editorContent = ref("")
  const selectedEnv = ref<Environment>("DEVELOPMENT")
  const secrets = computed(() => toValue(options.secrets))
  const projectId = computed(() => toValue(options.projectId))
  const parsedEditorValues = computed(() => parseEnv(editorContent.value))
  const currentEnvValues = computed(() => getEnvValues(secrets.value, selectedEnv.value))
  const previewItems = computed(() => buildEnvPreview(currentEnvValues.value, parsedEditorValues.value))
  const hasPreview = computed(() => previewItems.value.length > 0)

  function selectEnvironment(env: Environment) {
    selectedEnv.value = env
    editorContent.value = buildEnvText(secrets.value, env)
  }

  // Reset editor for the Development env, optionally merge dropped/imported content.
  function resetEditor(initialContent?: string | null) {
    selectedEnv.value = "DEVELOPMENT"
    const current = buildEnvText(secrets.value, "DEVELOPMENT")
    editorContent.value = initialContent?.trim() ? mergeEnvText(current, initialContent) : current
  }

  function getChanges() {
    return buildSecretChangesFromEnv(projectId.value, secrets.value, selectedEnv.value, parsedEditorValues.value)
  }

  return {
    selectedEnv,
    editorContent,
    parsedEditorValues,
    currentEnvValues,
    previewItems,
    hasPreview,
    selectEnvironment,
    resetEditor,
    getChanges,
  }
}
