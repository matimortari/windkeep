let toastIdCounter = 0
let resolveConfirmation: ((value: boolean) => void) | null = null

export function useUI() {
  const state = useState<UIState>("ui", () => ({
    sidebar: false,
    dialogs: {
      projects: { isOpen: false, data: null },
      secrets: { isOpen: false, data: null },
      history: { isOpen: false, data: null },
      raw: { isOpen: false, data: null },
    },
    toasts: [],
    confirmation: { isOpen: false, options: null },
  }))

  const sidebar = {
    isOpen: () => state.value.sidebar,
    open: () => { state.value.sidebar = true },
    close: () => { state.value.sidebar = false },
    toggle: () => { state.value.sidebar = !state.value.sidebar },
  }

  const dialog = {
    isOpen: (name: keyof DialogPayloads) => state.value.dialogs[name].isOpen,
    data: <K extends keyof DialogPayloads>(name: K) => state.value.dialogs[name].data as DialogPayloads[K],
    open<K extends keyof DialogPayloads>(name: K, data: DialogPayloads[K] = null as DialogPayloads[K]) {
      state.value.dialogs[name] = { isOpen: true, data } as UIState["dialogs"][K]
    },
    close(name: keyof DialogPayloads) {
      state.value.dialogs[name] = { isOpen: false, data: null }
    },
  }

  const toast = {
    list: () => state.value.toasts as readonly Toast[],
    show(message: string, type: Toast["type"], duration = 5000) {
      if (import.meta.server) {
        return ""
      }

      const id = `toast-${++toastIdCounter}`
      state.value.toasts.push({ id, message, type, duration })
      if (duration > 0) {
        setTimeout(toast.dismiss, duration, id)
      }
      return id
    },
    success: (message: string, duration = 5000) => toast.show(message, "success", duration),
    error: (message: string, duration = 7000) => toast.show(message, "danger", duration),
    warning: (message: string, duration = 6000) => toast.show(message, "warning", duration),
    info: (message: string, duration = 5000) => toast.show(message, "info", duration),
    dismiss(id: string) {
      state.value.toasts = state.value.toasts.filter(t => t.id !== id)
    },
    clear() {
      state.value.toasts = []
    },
  }

  function confirm(options: ConfirmOptions): Promise<boolean> {
    if (import.meta.server) {
      return Promise.resolve(false)
    }

    resolveConfirmation?.(false)
    state.value.confirmation = { isOpen: true, options }
    return new Promise(resolve => resolveConfirmation = resolve)
  }

  const confirmation = {
    isOpen: () => state.value.confirmation.isOpen,
    options: () => state.value.confirmation.options,
    resolve(value: boolean) {
      state.value.confirmation.isOpen = false
      resolveConfirmation?.(value)
      resolveConfirmation = null
    },
  }

  return { sidebar, dialog, toast, confirm, confirmation }
}
