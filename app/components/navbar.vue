<template>
  <div class="fixed top-2 left-1/2 z-50 w-[95%] -translate-x-1/2 transition-all duration-500" :class="[scrolled ? 'max-w-2xl' : 'max-w-4xl']">
    <div
      class="flex flex-row items-center justify-between rounded-full border-2 py-2 backdrop-blur-xl transition-all duration-500"
      :class="[scrolled ? 'bg-card/80 px-2 shadow-lg' : 'bg-card/50 px-4 shadow-none']"
    >
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

          <nuxt-link to="/cli-guide" class="text-caption flex flex-row items-center gap-1 hover:text-primary! hover:underline">
            <icon name="ph:terminal" size="20" />
            <span>CLI Guide</span>
          </nuxt-link>
        </div>
      </nav>

      <nav class="navigation-group" aria-label="User Actions">
        <button class="btn rounded-full!" aria-label="Toggle Theme" @click="toggleTheme">
          <icon :name="themeIcon" size="20" />
        </button>

        <nuxt-link v-if="!loggedIn" to="/sign-in" class="btn rounded-full!" aria-label="Sign In">
          <icon name="ph:sign-in" size="20" />
        </nuxt-link>

        <button v-if="loggedIn" class="btn rounded-full!" aria-label="Sign Out" @click="signOut">
          <icon name="ph:sign-out" size="20" />
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
const { toggleTheme, themeIcon } = useTheme()
const { loggedIn } = useUserSession()
const scrolled = ref(false)

onMounted(() => {
  const handleScroll = () => scrolled.value = window.scrollY > 50
  window.addEventListener("scroll", handleScroll, { passive: true })
  onBeforeUnmount(() => window.removeEventListener("scroll", handleScroll))
})
</script>
