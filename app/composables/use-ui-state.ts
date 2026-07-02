const uiState = reactive<UIState>({
  sidebar: false,
  dialogs: {
    projects: false,
    secrets: { isOpen: false, selectedSecret: null },
    history: false,
    raw: false,
  },
  adminTabs: {
    organization: ORGANIZATION_TABS[0]!.key,
    project: PROJECT_TABS[0]!.key,
    projectSlug: null,
  },
})

export function useUIState() {
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
  const toggleSidebar = () => uiState.sidebar = !uiState.sidebar

  const isSecretsEditorOpen = computed(() => uiState.dialogs.secrets.isOpen)
  const selectedSecret = computed(() => uiState.dialogs.secrets.selectedSecret)
  const isProjectsEditorOpen = computed(() => uiState.dialogs.projects)
  const isHistoryEditorOpen = computed(() => uiState.dialogs.history)
  const isRawEditorOpen = computed(() => uiState.dialogs.raw)
  const isSidebarOpen = computed(() => uiState.sidebar)

  function setTab(section: "organization" | "project", tab: string) {
    uiState.adminTabs[section] = tab
  }

  function setActiveProject(slug: string | null) {
    uiState.adminTabs.projectSlug = slug
  }

  return {
    uiState,
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
    toggleSidebar,
    setTab,
    setActiveProject,
  }
}
