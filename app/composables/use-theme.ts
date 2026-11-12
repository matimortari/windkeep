import logoDark from "~/assets/wordmark-dark.png"
import logoLight from "~/assets/wordmark-light.png"

export function useTheme() {
  const colorMode = useColorMode()
  const themeIcon = computed(() => colorMode.value === "light" ? "ph:moon-stars-bold" : "ph:sun-horizon-bold")
  const themeTitle = computed(() => colorMode.value === "light" ? logoDark : logoLight)

  const toggleTheme = () => colorMode.preference = colorMode.value === "light" ? "dark" : "light"

  return { colorMode, themeIcon, themeTitle, toggleTheme }
}
