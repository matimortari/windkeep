<template>
  <div class="flex min-h-screen w-full items-center justify-center">
    <div
      v-motion :initial="{ opacity: 0 }"
      :visible="{ opacity: 1 }" :duration="800"
      class="card w-full max-w-sm md:max-w-md 2xl:max-w-lg"
    >
      <header class="flex flex-col items-center gap-2 py-4 text-center">
        <h1 class="font-display">
          Sign In
        </h1>
        <p class="text-caption">
          Choose a provider to continue.
        </p>
      </header>

      <div class="flex flex-col justify-center gap-4 border-y p-4 2xl:p-8">
        <button v-for="provider in OAUTH_PROVIDERS" :key="provider.name" class="btn" @click="signIn(provider.name)">
          <icon :name="provider.icon" size="25" />
          <span>{{ provider.label }}</span>
        </button>
      </div>

      <p class="text-caption mx-auto max-w-xs py-4 text-center">
        By signing in, you agree to our
        <nuxt-link to="/legal/terms" class="underline hover:text-primary">
          Terms of Service
        </nuxt-link>
        and
        <nuxt-link to="/legal/privacy" class="underline hover:text-primary">
          Privacy Policy.
        </nuxt-link>
      </p>
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
</script>
