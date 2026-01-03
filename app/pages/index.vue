<template>
  <div
    v-motion :initial="{ opacity: 0 }"
    :visible="{ opacity: 1 }" :duration="800"
    class="relative flex min-h-screen w-full flex-col items-center justify-center gap-12 py-24 text-center"
  >
    <header id="hero" class="z-20 flex w-full flex-col items-center gap-8 px-4 py-20 md:px-20">
      <h1 class="font-display md:text-5xl! 2xl:text-6xl!">
        Your Secrets, Secured.
      </h1>
      <p class="max-w-2xl leading-6 font-semibold text-muted-foreground md:text-lg">
        No more .env headaches — WindKeep is a secrets management platform that helps organizations securely store, manage, and share sensitive information.
      </p>

      <div class="flex flex-col items-center gap-4 backdrop-blur-xs">
        <nuxt-link to="/sign-in" class="btn rounded-full! shadow-lg shadow-primary/20 hover:shadow-primary/30">
          <span>Create Account</span>
          <icon name="ph:arrow-right-bold" size="20" />
        </nuxt-link>

        <nuxt-link to="/cli-guide" class="text-caption group flex flex-row items-center gap-1">
          <span>Or explore the <span class="font-semibold text-primary group-hover:underline"> WindKeep CLI</span></span>
          <icon name="ph:code-block-bold" size="20" class="text-primary transition-transform group-hover:scale-125" />
        </nuxt-link>
      </div>
    </header>

    <section id="highlights" class="flex w-full flex-col items-center justify-center gap-8 md:flex-row">
      <div
        v-for="(highlight, index) in HIGHLIGHTS" :key="index"
        v-motion :initial="{ opacity: 0, y: 20 }"
        :visible="{ opacity: 1, y: 0 }" :duration="800"
        :delay="200 * index" class="card flex max-w-sm flex-col items-start gap-2"
      >
        <div class="flex flex-row items-center gap-2">
          <span class="card rounded-full! p-2!">
            <icon :name="highlight.icon" class="text-primary" size="25" />
          </span>
          <h4>
            {{ highlight.title }}
          </h4>
        </div>
        <p class="text-caption text-start">
          {{ highlight.description }}
        </p>
      </div>
    </section>
  </div>

  <section
    id="cli" v-motion
    :initial="{ opacity: 0, y: 20 }" :visible="{ opacity: 1, y: 0 }"
    :duration="800" class="w-full border-y-2 bg-card py-24"
  >
    <div class="container mx-auto flex flex-col items-center justify-center gap-8 p-4 md:flex-row md:gap-20 2xl:gap-32">
      <header class="flex flex-col items-center gap-4 text-center md:items-start md:text-start">
        <h2 class="font-display">
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

        <ul class="text-caption flex flex-col items-start gap-2">
          <li v-for="bullet in CLI_BULLETS" :key="bullet.description" class="navigation-group">
            <span>• {{ bullet.description }} </span>
          </li>
        </ul>
      </header>

      <div class="w-full max-w-xl flex-1 px-2 md:min-w-80 md:px-0">
        <div class="my-2 flex flex-row gap-1">
          <button
            v-for="tab in [{ key: 'install', label: 'Installation' }, { key: 'commands', label: 'Usage' }]" :key="tab.key"
            class="text-caption flex-1 rounded-t-sm border-2 border-b-4 p-2" :class="activeTab === tab.key ? 'border-b-primary' : 'border-transparent'"
            @click="activeTab = (tab.key as 'install' | 'commands')"
          >
            {{ tab.label }}
          </button>
        </div>

        <article v-if="activeTab === 'install'" class="card space-y-1">
          <p class="text-caption">
            > Install the Go module:
          </p>
          <Shiki lang="bash" :code="INSTALL_COMMAND" class="code-block" />
        </article>

        <article v-if="activeTab === 'commands'" class="card space-y-1">
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
    :initial="{ opacity: 0, y: 20 }" :visible="{ opacity: 1, y: 0 }"
    :duration="800" class="flex w-full flex-col items-center gap-12 px-4 py-12 md:px-20 md:py-20"
  >
    <h2 class="font-display">
      Features
    </h2>

    <div class="grid grid-cols-1 place-items-center gap-12 md:grid-cols-2 md:gap-24">
      <div
        v-for="(feature, index) in FEATURES" :key="index"
        v-motion :initial="{ opacity: 0, y: -20 }"
        :visible="{ opacity: 1, y: 0 }" :duration="800"
        :delay="200 * index" class="flex max-w-md flex-col items-center gap-4 text-center"
      >
        <div class="card flex items-center justify-center rounded-2xl!">
          <icon :name="feature.icon" class="text-primary" size="70" />
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
    :initial="{ opacity: 0, y: 20 }" :visible="{ opacity: 1, y: 0 }"
    :duration="800" class="flex w-full flex-col items-center gap-8 px-4 py-12 text-center md:p-20 2xl:p-32"
  >
    <h2 class="font-display">
      Frequently Asked Questions
    </h2>

    <div class="flex w-full flex-col items-center justify-center divide-y">
      <div v-for="(item, index) in FAQS" :key="index" class="w-full max-w-xs space-y-2 py-4 md:max-w-xl">
        <button class="group flex w-full items-start justify-between gap-2 font-semibold hover:text-primary" @click="toggleAccordion(index)">
          <p>{{ item.question }}</p>
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
const openIndex = ref<number | null>(null)
const activeTab = ref<"install" | "commands">("install")

function toggleAccordion(index: number) {
  openIndex.value = openIndex.value === index ? null : index
}

useHead({
  title: "Securely Manage Your Environment Variables",
  link: [{ rel: "canonical", href: "https://windkeep.vercel.app" }],
  meta: [{ name: "description", content: "Centralize, encrypt, and share your secrets with confidence. Fast, safe, and easy to use." }],
})

definePageMeta({
  middleware: guest,
})
</script>

<style scoped>
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
</style>
