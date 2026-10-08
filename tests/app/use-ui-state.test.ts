import { beforeEach, describe, expect, it } from "vitest"
import { useUIState } from "../../app/composables/use-ui-state"

describe("useUIState", () => {
  beforeEach(() => {
    const ui = useUIState()
    ui.closeDialog("secrets")
    ui.closeDialog("projects")
    ui.closeDialog("history")
    ui.closeDialog("raw")
    ui.closeSidebar()
    ui.setTab("organization", "projects")
    ui.setTab("project", "secrets")
    ui.setActiveProject(null)
  })

  it("opens and closes dialogs, clearing selected secret on close", () => {
    const ui = useUIState()
    const secret = { key: "API_KEY" } as Secret

    ui.openDialog("secrets")
    ui.selectSecret(secret)
    expect(ui.isSecretsEditorOpen.value).toBe(true)
    expect(ui.selectedSecret.value).toEqual(secret)

    ui.closeDialog("secrets")
    expect(ui.isSecretsEditorOpen.value).toBe(false)
    expect(ui.selectedSecret.value).toBeNull()

    ui.openDialog("projects")
    expect(ui.isProjectsEditorOpen.value).toBe(true)
    ui.closeDialog("projects")
    expect(ui.isProjectsEditorOpen.value).toBe(false)
  })

  it("toggles sidebar and updates admin tabs", () => {
    const ui = useUIState()

    ui.openSidebar()
    expect(ui.isSidebarOpen.value).toBe(true)
    ui.toggleSidebar()
    expect(ui.isSidebarOpen.value).toBe(false)

    ui.setTab("organization", "members")
    ui.setTab("project", "settings")
    ui.setActiveProject("demo")
    expect(ui.uiState.adminTabs).toEqual({ organization: "members", project: "settings", projectSlug: "demo" })
  })
})
