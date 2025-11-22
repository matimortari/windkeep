import logoDark from "~/assets/wordmark-dark.png"
import logoLight from "~/assets/wordmark-light.png"

export function useTheme() {
  const colorMode = useState<"dark" | "light">("theme", () => "dark")
  const storageKey = "nuxt-color-mode"

  const updateHtmlClass = () => {
    const html = globalThis.document.documentElement
    html.classList.remove("dark", "light")
    html.classList.add(colorMode.value)
  }

  const syncThemeFromLocalStorage = () => {
    const saved = globalThis.localStorage.getItem(storageKey)
    if (saved === "light" || saved === "dark") {
      colorMode.value = saved
    }
    else {
      const prefersLight = globalThis.matchMedia("(prefers-color-scheme: light)").matches
      colorMode.value = prefersLight ? "light" : "dark"
    }

    updateHtmlClass()
  }

  const toggleTheme = () => {
    colorMode.value = colorMode.value === "light" ? "dark" : "light"
    globalThis.localStorage.setItem(storageKey, colorMode.value)
    updateHtmlClass()
  }

  onMounted(() => {
    syncThemeFromLocalStorage()
  })

  const themeIcon = computed(() =>
    colorMode.value === "light" ? "ph:moon-stars" : "ph:sun-horizon",
  )

  const themeTitle = computed(() =>
    colorMode.value === "light" ? logoDark : logoLight,
  )

  return {
    colorMode,
    toggleTheme,
    themeIcon,
    themeTitle,
  }
}
