<template>
  <div class="flex w-full items-center justify-center">
    <div class="card w-full max-w-md">
      <header class="my-4 flex flex-col items-center gap-2 text-center">
        <h1>
          Sign In
        </h1>
        <p class="text-muted-foreground">
          Choose a provider to continue.
        </p>
      </header>

      <div class="flex flex-col justify-center gap-4 p-4">
        <button v-for="provider in OAUTH_PROVIDERS" :key="provider.name" class="btn" @click="signIn(provider.name)">
          <icon :name="provider.icon" size="25" />
          <span>{{ provider.label }}</span>
        </button>
      </div>

      <footer class="mx-auto my-4 max-w-xs text-center">
        <p class="text-muted-foreground text-center text-sm">
          By signing in, you agree to our
          <nuxt-link to="/legal/terms" class="hover:text-primary underline">
            Terms of Service
          </nuxt-link>
          and
          <nuxt-link to="/legal/privacy" class="hover:text-primary underline">
            Privacy Policy
          </nuxt-link>.
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
function signIn(provider: string) {
  navigateTo(`/api/auth/${provider}`, { external: true })
}

useHead({
  title: "Sign In",
  meta: [{ name: "description", content: "SecretkeepR Sign In page" }],
})

definePageMeta({
  layout: "fullscreen",
})
</script>
