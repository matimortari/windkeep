import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  modules: [
    "@nuxt/content",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxtjs/color-mode",
    "@pinia/nuxt",
    "@vueuse/motion/nuxt",
    "nuxt-auth-utils",
    "nuxt-shiki",
  ],
  runtimeConfig: {
    session: {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      password: process.env.NUXT_SESSION_PASSWORD!,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    },
  },
  vite: {
    plugins: [tailwindcss() as any],
  },
  app: {
    head: {
      script: [{ "src": "https://static.cloudflareinsights.com/beacon.min.js", "defer": true, "data-cf-beacon": "{\"token\": \"59e0cb447ba54c72bf6a994997bea0e9\"}" }],
    },
  },
  css: ["~/assets/styles.css"],
  devtools: {
    enabled: true,
  },
  colorMode: {
    classSuffix: "",
    preference: "system",
    fallback: "light",
    storageKey: "nuxt-color-mode",
  },
  content: {
    _localDatabase: {
      type: "sqlite",
      filename: ".nuxt/content/local.db",
    },
  },
  fonts: {
    processCSSVariables: true,
    families: [
      // Base fonts (default, display, mono)
      { name: "Roboto", provider: "google", weights: ["300 800"] },
      { name: "Russo One", provider: "google", weights: ["400"] },
      { name: "JetBrains Mono", provider: "google", weights: ["400"] },
    ],
  },
  icon: {
    mode: "svg",
    clientBundle: {
      scan: true,
    },
  },
  shiki: {
    bundledLangs: ["bash", "go", "html", "javascript", "json", "markdown", "typescript", "vue"],
    bundledThemes: ["nord"],
    highlightOptions: {
      theme: "nord",
    },
  },
  build: {
    transpile: ["shiki"],
  },
})
