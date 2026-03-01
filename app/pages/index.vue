<template>
  <section
    id="hero" v-motion
    :initial="{ opacity: 0 }" :visible-once="{ opacity: 1 }"
    :duration="800" class="relative flex min-h-screen w-full flex-col items-center justify-center gap-8 px-4 py-24 text-center"
  >
    <header class="z-20 flex w-full max-w-2xl flex-col items-center gap-8">
      <h1>
        Your Secrets, Secured.
      </h1>
      <p class="leading-6 font-semibold text-muted-foreground md:text-lg">
        No more .env headaches – WindKeep is a secrets management platform that helps organizations securely store, manage, and share sensitive information.
      </p>

      <div aria-hidden="true" class="pointer-events-none absolute inset-0 z-[-1] overflow-hidden">
        <div class="blob blob-1" />
        <div class="blob blob-2" />
      </div>

      <div class="flex flex-col items-center gap-4 md:flex-row">
        <nuxt-link to="/sign-in" class="group btn rounded-full! bg-linear-to-r from-primary to-secondary px-8 shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/40">
          <span class="font-semibold">Get Started</span>
          <icon name="ph:arrow-right-bold" size="20" class="transition-transform group-hover:translate-x-1" />
        </nuxt-link>
        <nuxt-link to="/cli-guide" class="btn-ghost group rounded-full! border-2 border-muted px-8 backdrop-blur-sm hover:border-primary/50">
          <icon name="ph:code-block-bold" size="20" class="text-primary" />
          <span class="font-semibold">WindKeep CLI</span>
        </nuxt-link>
      </div>

      <div class="flex w-full flex-wrap items-center justify-center gap-4 border-t py-8 md:gap-8">
        <div
          v-for="(highlight, index) in HIGHLIGHTS" :key="index"
          v-motion :initial="{ opacity: 0, y: 20 }"
          :visible-once="{ opacity: 1, y: 0 }" :duration="800"
          :delay="200 * index" class="navigation-group"
        >
          <span class="card rounded-full! p-2!">
            <icon :name="highlight.icon" class="text-primary" size="20" />
          </span>
          <span class="font-semibold text-muted-foreground">{{ highlight.title }}</span>
        </div>
      </div>
    </header>
  </section>

  <section id="cli" class="w-full border-y-2 bg-card py-20">
    <div class="container mx-auto flex flex-col items-center justify-center gap-8 p-4 md:flex-row md:gap-20 2xl:gap-32">
      <header class="flex flex-col items-center gap-4 text-center md:items-start md:text-start">
        <h2>
          Command Line Interface
        </h2>

        <p class="max-w-lg font-semibold text-muted-foreground">
          Manage secrets and projects directly from your terminal. Fast, secure, and open-source.
          Read the
          <nuxt-link to="/cli-guide" class="text-primary hover:underline">
            documentation
          </nuxt-link>
          for more details.
        </p>

        <ul class="flex flex-col items-start gap-1 font-medium text-muted-foreground">
          <li v-for="bullet in CLI_BULLETS" :key="bullet.description" class="navigation-group">
            <span>• {{ bullet.description }} </span>
          </li>
        </ul>
      </header>

      <div class="w-full max-w-xl flex-1 px-2 md:min-w-80 md:px-0">
        <div class="my-2 flex flex-row gap-1">
          <button
            v-for="tab in [{ key: 'install', label: 'Installation' }, { key: 'commands', label: 'Usage' }]" :key="tab.key"
            class="text-caption flex-1 rounded-t-lg border-2 p-2 pb-1! hover:bg-muted/50" :class="activeTab === tab.key ? 'border-b-primary' : ''"
            @click="activeTab = (tab.key as 'install' | 'commands')"
          >
            {{ tab.label }}
          </button>
        </div>

        <article v-if="activeTab === 'install'" class="card space-y-2">
          <p class="text-caption">
            > Run the following command from your terminal:
          </p>
          <Shiki lang="bash" :code="Array.isArray(INSTALL_COMMAND) ? INSTALL_COMMAND.join('\n') : INSTALL_COMMAND" class="code-block" />
        </article>

        <article v-if="activeTab === 'commands'" class="card space-y-2">
          <p class="text-caption">
            > After installing, run the following commands to get started:
          </p>
          <Shiki lang="bash" :code="CLI_COMMANDS.join('\n')" class="code-block" />
        </article>
      </div>
    </div>
  </section>

  <section
    id="features" v-motion
    :initial="{ opacity: 0, y: 20 }" :visible-once="{ opacity: 1, y: 0 }"
    :duration="800" class="flex w-full flex-col items-center gap-12 px-4 py-24"
  >
    <h2>
      Features
    </h2>

    <div class="grid grid-cols-1 place-items-center gap-12 md:grid-cols-2 md:gap-20 2xl:gap-32">
      <div
        v-for="(feature, index) in FEATURES" :key="index"
        v-motion :initial="{ opacity: 0, y: -20 }"
        :visible-once="{ opacity: 1, y: 0 }" :duration="800"
        :delay="200 * index" class="flex max-w-sm flex-col items-center gap-4 text-center"
      >
        <div class="card flex items-center justify-center rounded-2xl!">
          <icon :name="feature.icon" class="text-primary" size="50" />
        </div>
        <h3 class="whitespace-nowrap">
          {{ feature.title }}
        </h3>
        <p class="text-caption">
          {{ feature.description }}
        </p>
      </div>
    </div>
  </section>

  <section
    id="faq" v-motion
    :initial="{ opacity: 0, y: 20 }" :visible-once="{ opacity: 1, y: 0 }"
    :duration="800" class="flex w-full flex-col items-center gap-8 px-4 py-24 text-center"
  >
    <h2>
      Frequently Asked Questions
    </h2>

    <div class="flex w-full flex-col items-center justify-center divide-y">
      <div v-for="(item, index) in FAQS" :key="index" class="w-full max-w-xs space-y-2 p-4 md:max-w-xl">
        <button class="group flex w-full items-start justify-between gap-2 font-semibold transition-all hover:text-primary" @click="openIndex = openIndex === index ? null : index">
          <p class="text-sm/4 md:text-base">
            {{ item.question }}
          </p>
          <icon name="ph:plus-bold" size="25" class="shrink-0 transition-transform group-hover:scale-125" :class="openIndex === index ? 'rotate-45 text-primary' : 'rotate-0'" />
        </button>

        <transition name="accordion">
          <p v-if="openIndex === index" class="text-caption transition-transform">
            {{ item.answer }}
          </p>
        </transition>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const openIndex = ref<number | null>(null)
const activeTab = ref<"install" | "commands">("install")

useHead({
  title: "Securely Manage Your Environment Variables",
  link: [{ rel: "canonical", href: `${baseURL}` }],
  meta: [{ name: "description", content: "Centralize, encrypt, and share your secrets with confidence. Fast, safe, and easy to use." }],
})

definePageMeta({
  middleware: "guest",
})
</script>

<style scoped>
h1,
h2 {
  font-family: var(--font-display);
}
@media (min-width: 768px) {
  h1 {
    font-size: 3.5rem;
  }
}

.accordion-enter-active,
.accordion-leave-active {
  transition:
    max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  max-height: 500px;
  opacity: 1;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  will-change: transform;
  animation: blob-drift 14s ease-in-out infinite alternate;
}

.blob-1 {
  width: 500px;
  height: 500px;
  background: color-mix(in srgb, var(--primary) 70%, var(--accent, white));
  opacity: 0.2;
  top: -100px;
  left: 60%;
  transform: translateX(-50%);
  animation-duration: 15s;
}

.blob-2 {
  width: 300px;
  height: 300px;
  background: color-mix(in srgb, var(--primary) 70%, var(--accent, white));
  opacity: 0.1;
  bottom: 20px;
  right: 8%;
  animation-duration: 10s;
  animation-delay: -5s;
}

@keyframes blob-drift {
  0% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(20px, -15px) scale(1.03);
  }
  100% {
    transform: translate(-15px, 10px) scale(0.98);
  }
}
</style>
