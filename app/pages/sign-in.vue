<template>
  <div class="flex min-h-screen w-full items-center justify-center p-4">
    <div class="sign-in-panel w-full max-w-md border-none bg-transparent py-32">
      <header class="flex flex-col items-center gap-2 py-4 text-center">
        <h1 class="font-display">
          Sign In
        </h1>
        <p class="text-caption">
          Choose a provider to continue.
        </p>
        <span v-if="errorMessage" class="text-caption-danger">{{ errorMessage }}</span>
      </header>

      <div class="flex flex-col justify-center gap-4 border-y p-4">
        <button
          v-for="(provider, index) in OAUTH_PROVIDERS" :key="provider.name"
          type="button" class="btn sign-in-provider"
          :style="{ animationDelay: `${80 + index * 60}ms` }" @click="signIn(provider.name)"
        >
          <icon :name="provider.icon" size="25" />
          <span>{{ provider.label }}</span>
        </button>
      </div>

      <p class="text-caption py-4 text-center">
        By signing in, you agree to our
        <nuxt-link to="/legal/terms" class="text-primary hover:underline">
          Terms of Service
        </nuxt-link>
        and
        <nuxt-link to="/legal/privacy" class="text-primary hover:underline">
          Privacy Policy.
        </nuxt-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const { signIn } = useSession()
const route = useRoute()

const errorMessage = computed(() => {
  const error = route.query.error as string | undefined
  if (!error) {
    return null
  }

  const messages: Record<string, string> = {
    google_oauth_failed: "Google sign in failed. Please try again.",
    github_oauth_failed: "GitHub sign in failed. Please try again.",
    gitlab_oauth_failed: "GitLab sign in failed. Please try again.",
    session_expired: "Your session has expired. Please sign in again.",
    session_timeout: "You were signed out due to inactivity.",
  }

  return messages[error] || "Authentication failed. Please try again."
})

useHead({
  title: "Sign In",
  link: [{ rel: "canonical", href: `${baseURL}` }],
  meta: [{ name: "description", content: "Sign in to your WindKeep account" }],
})
</script>

<style scoped>
.sign-in-panel {
  animation: sign-in-enter var(--duration-slow) var(--ease-emphasized) both;
}
.sign-in-provider {
  animation: sign-in-enter var(--duration-base) var(--ease-emphasized) both;
}

@keyframes sign-in-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
