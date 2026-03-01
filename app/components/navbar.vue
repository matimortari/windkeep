<template>
  <div class="fixed top-2 left-1/2 z-50 w-[95%] -translate-x-1/2 transition-all" :class="[scrolled ? 'max-w-4xl' : 'max-w-5xl']">
    <div
      class="flex flex-row items-center justify-between rounded-full border-2 py-2 backdrop-blur-xl transition-all"
      :class="[scrolled ? 'bg-card/80 px-2 shadow-lg' : 'bg-card/50 px-4 shadow-none']"
    >
      <nav class="navigation-group gap-4!" aria-label="Main Navigation">
        <Logo />

        <div class="hidden gap-4! border-l-2 pl-4! text-muted-foreground md:navigation-group">
          <nuxt-link to="/#features" class="flex flex-row items-center gap-1 text-sm font-semibold hover:underline">
            <icon name="ph:star-bold" size="20" />
            <span>Features</span>
          </nuxt-link>

          <nuxt-link to="/#faq" class="flex flex-row items-center gap-1 text-sm font-semibold hover:underline">
            <icon name="ph:question-bold" size="20" />
            <span>FAQ</span>
          </nuxt-link>

          <nuxt-link to="/cli-guide" class="flex flex-row items-center gap-1 text-sm font-semibold hover:underline">
            <icon name="ph:terminal-bold" size="20" />
            <span>CLI Guide</span>
          </nuxt-link>
        </div>
      </nav>

      <nav class="navigation-group" aria-label="User Actions">
        <button class="btn rounded-full!" aria-label="Toggle Theme" @click="toggleTheme">
          <icon :name="themeIcon" size="20" />
        </button>

        <nuxt-link v-if="!loggedIn" to="/sign-in" class="btn rounded-full!" aria-label="Sign In">
          <icon name="ph:sign-in-bold" size="20" />
        </nuxt-link>

        <button v-if="loggedIn" class="btn rounded-full!" aria-label="Sign Out" @click="signOut">
          <icon name="ph:sign-out-bold" size="20" />
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
const { toggleTheme, themeIcon } = useTheme()
const { loggedIn } = useUserSession()
const scrolled = ref(false)

const handleScroll = () => scrolled.value = window.scrollY > 50
onMounted(() => window.addEventListener("scroll", handleScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener("scroll", handleScroll))
</script>
