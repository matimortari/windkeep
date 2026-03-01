import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  modules: [
    "@nuxt/content",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxtjs/color-mode",
    "@nuxtjs/seo",
    "@pinia/nuxt",
    "@vueuse/motion/nuxt",
    "nuxt-auth-utils",
    "nuxt-shiki",
  ],
  runtimeConfig: {
    public: {
      baseURL: process.env.NUXT_PUBLIC_BASE_URL,
    },
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
  nitro: {
    externals: {
      inline: ["unhead"],
    },
  },
  app: {
    head: {
      script: process.env.NODE_ENV === "production" ? [{ "src": "https://static.cloudflareinsights.com/beacon.min.js", "defer": true, "data-cf-beacon": "{\"token\": \"59e0cb447ba54c72bf6a994997bea0e9\"}" }] : [],
    },
  },
  css: ["~/assets/styles.css"],
  site: {
    url: process.env.NUXT_PUBLIC_BASE_URL,
    name: "WindKeep",
  },
  robots: {
    disallow: ["/admin", "/onboarding"],
  },
  colorMode: {
    classSuffix: "",
    preference: "system",
    fallback: "light",
    storageKey: "nuxt-color-mode",
  },
  fonts: {
    processCSSVariables: true,
    families: [
      { name: "Roboto", provider: "google", weights: ["300 800"] },
      { name: "Russo One", provider: "google", weights: ["400"] },
      { name: "JetBrains Mono", provider: "google", weights: ["400"] },
    ],
  },
  icon: {
    mode: "svg",
    clientBundle: { scan: true },
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
