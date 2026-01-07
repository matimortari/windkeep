<template>
  <div class="fixed top-2 left-1/2 z-50 w-[95%] max-w-6xl -translate-x-1/2">
    <div class="flex flex-row items-center justify-between rounded-lg border-2 bg-card/50 p-2 backdrop-blur-xl">
      <nav class="navigation-group gap-8!" aria-label="Main Navigation">
        <Logo />

        <div class="hidden gap-4! md:navigation-group">
          <nuxt-link to="/#features" class="text-caption flex flex-row items-center gap-1 hover:text-primary! hover:underline">
            <icon name="ph:star" size="20" />
            <span>Features</span>
          </nuxt-link>

          <nuxt-link to="/#faq" class="text-caption flex flex-row items-center gap-1 hover:text-primary! hover:underline">
            <icon name="ph:question" size="20" />
            <span>FAQ</span>
          </nuxt-link>

          <nuxt-link to="/cli-guide" class="text-caption p flex flex-row items-center gap-1 hover:text-primary! hover:underline">
            <icon name="ph:terminal" size="20" />
            <span>CLI Guide</span>
          </nuxt-link>
        </div>
      </nav>

      <nav class="navigation-group" aria-label="User Actions">
        <button class="btn" aria-label="Toggle Theme" @click="toggleTheme">
          <icon :name="themeIcon" size="20" />
        </button>

        <nuxt-link v-if="!loggedIn" to="/sign-in" class="btn" aria-label="Sign In">
          <icon name="ph:sign-in" size="20" />
          <span>Sign In</span>
        </nuxt-link>

        <button v-if="loggedIn" class="btn" aria-label="Sign Out" @click="signOut">
          <icon name="ph:sign-out" size="20" />
          <span>Sign Out</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
const { toggleTheme, themeIcon } = useTheme()
const { loggedIn } = useUserSession()
</script>
