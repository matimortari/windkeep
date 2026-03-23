const uiState = reactive<UIState>({ sidebar: false, dialogs: { projects: false, secrets: { isOpen: false, selectedSecret: null }, history: false, raw: false } })

export function useDialogs() {
  const openDialog = (type: "secrets" | "projects" | "history" | "raw") => {
    if (type === "secrets") {
      uiState.dialogs.secrets.isOpen = true
    }
    else {
      uiState.dialogs[type] = true
    }
  }

  const closeDialog = (type: "secrets" | "projects" | "history" | "raw") => {
    if (type === "secrets") {
      uiState.dialogs.secrets.isOpen = false
      uiState.dialogs.secrets.selectedSecret = null
    }
    else {
      uiState.dialogs[type] = false
    }
  }

  function selectSecret(secret: Secret | null) {
    uiState.dialogs.secrets.selectedSecret = secret
  }

  const openSidebar = () => uiState.sidebar = true
  const closeSidebar = () => uiState.sidebar = false

  const isSecretsEditorOpen = computed(() => uiState.dialogs.secrets.isOpen)
  const selectedSecret = computed(() => uiState.dialogs.secrets.selectedSecret)
  const isProjectsEditorOpen = computed(() => uiState.dialogs.projects)
  const isHistoryEditorOpen = computed(() => uiState.dialogs.history)
  const isRawEditorOpen = computed(() => uiState.dialogs.raw)
  const isSidebarOpen = computed(() => uiState.sidebar)

  return {
    isSecretsEditorOpen,
    selectedSecret,
    isProjectsEditorOpen,
    isHistoryEditorOpen,
    isRawEditorOpen,
    isSidebarOpen,
    selectSecret,
    openDialog,
    closeDialog,
    openSidebar,
    closeSidebar,
  }
}
