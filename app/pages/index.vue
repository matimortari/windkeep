<template>
  <section
    id="hero" v-motion
    :initial="{ opacity: 0 }" :visible="{ opacity: 1 }"
    :duration="800" class="flex min-h-screen flex-col items-center justify-center px-4 py-36 text-center 2xl:min-h-[60vh]"
  >
    <div class="hero-backdrop" />

    <header class="z-20 flex w-full max-w-2xl flex-col items-center gap-8">
      <div class="flex flex-col items-center gap-8">
        <h1 class="font-display md:text-6xl!">
          Your Secrets, Secured.
        </h1>
        <p class="text-muted-foreground max-w-xl leading-5 font-semibold md:text-lg">
          No more .env headaches. SecretkeepR is a secrets management platform that helps organizations securely store, manage, and share sensitive information.
        </p>
      </div>

      <div class="flex w-full flex-row items-center justify-center gap-4 md:gap-8">
        <nuxt-link to="/sign-in" class="btn-primary hero-btn">
          <span>Get Started</span>
          <icon name="dinkie-icons:heart-black-suit-circled" size="20" />
        </nuxt-link>

        <nuxt-link to="/cli" class="flex flex-row items-center gap-2 text-sm font-semibold whitespace-nowrap hover:underline">
          <span>SecretkeepR CLI</span>
          <icon name="dinkie-icons:code-filled" size="20" />
        </nuxt-link>
      </div>
    </header>
  </section>

  <section id="highlights" class="flex flex-wrap justify-center gap-4 py-12 2xl:gap-8">
    <div
      v-for="(highlight, index) in HIGHLIGHTS" :key="index"
      v-motion :initial="{ opacity: 0, y: 20 }"
      :visible="{ opacity: 1, y: 0 }" :duration="800"
      :delay="200 * index" class="card flex max-w-sm flex-col items-center gap-2 text-center"
    >
      <h4>
        {{ highlight.title }}
      </h4>
      <p class="text-caption">
        {{ highlight.description }}
      </p>
    </div>
  </section>

  <section id="features" class="z-10 flex flex-col items-center gap-12 p-20 md:px-32 md:pb-36">
    <h2 class="font-display">
      Features
    </h2>

    <div class="flex flex-col flex-wrap items-center justify-center gap-8 md:flex-row 2xl:flex-row 2xl:flex-nowrap">
      <div
        v-for="(feature, index) in FEATURES" :key="index"
        v-motion :initial="{ opacity: 0, y: -20 }"
        :visible="{ opacity: 1, y: 0 }" :duration="800"
        :delay="200 * index" class="flex max-w-sm min-w-[350px] grow-0 flex-col items-center gap-4 p-4 text-center"
      >
        <icon :name="feature.icon" class="text-primary" size="70" />
        <h3 class="font-display-alt tracking-tighter whitespace-nowrap">
          {{ feature.title }}
        </h3>
        <p class="text-caption">
          {{ feature.description }}
        </p>
      </div>
    </div>
  </section>

  <section id="faq" class="flex flex-col items-center gap-12 px-8 py-16 md:px-32">
    <h2 class="font-display">
      Frequently Asked Questions
    </h2>

    <div class="flex w-full max-w-2xl flex-col divide-y">
      <div v-for="(item, index) in FAQS" :key="index" class="space-y-2 py-4">
        <button class="hover:text-primary group flex w-full items-center justify-between text-start font-semibold" @click="toggleAccordion(index)">
          <span>{{ item.question }}</span>
          <icon name="ph:plus-bold" size="20" class="shrink-0 transition-transform group-hover:scale-125" :class="openIndex === index ? 'rotate-45 text-primary' : 'rotate-0'" />
        </button>

        <transition name="accordion">
          <p v-if="openIndex === index" class="text-caption transition-transform">
            {{ item.answer }}
          </p>
        </transition>
      </div>
    </div>
  </section>

  <section
    id="cli" v-motion
    :initial="{ opacity: 0, y: 20 }" :visible="{ opacity: 1, y: 0 }"
    :duration="800" class="flex flex-col items-center gap-8 px-8 py-16 text-center md:px-32 md:text-start"
  >
    <header class="flex flex-col items-center gap-2">
      <h2 class="font-display">
        Command Line Interface
      </h2>
      <p class="text-caption max-w-sm text-center leading-5">
        Manage secrets and projects directly from your terminal. Fast, secure, and open-source.
      </p>
    </header>

    <div class="relative flex w-full max-w-2xl flex-col gap-4 2xl:gap-8">
      <article class="card flex flex-col p-0">
        <div class="text-caption flex items-center justify-between p-2">
          <p>
            > Install the Go module:
          </p>
          <button
            class="flex items-center" title="Copy to Clipboard"
            aria-label="Copy Install Command" @click="copyIcon.triggerCopy(INSTALL_COMMAND)"
          >
            <icon :name="copyIcon.icon.value" size="20" />
          </button>
        </div>
        <Shiki lang="bash" :code="INSTALL_COMMAND" class="code-block" />
      </article>

      <article class="card flex flex-col p-0">
        <p class="text-caption flex items-center justify-between p-2">
          > After installing, run the following commands to get started:
        </p>
        <Shiki lang="bash" :code="CLI_COMMANDS.join('\n')" class="code-block" />
      </article>

      <div class="text-muted-foreground absolute right-6 bottom-6 z-10 hidden items-end gap-2 text-xs font-medium select-none md:flex">
        <span>Powered by Go</span>
        <img src="/assets/gopher.png" alt="Gopher" width="35" height="35">
      </div>
    </div>

    <p class="text-caption border-b pb-2">
      Read the <nuxt-link to="/cli" class="text-primary hover:underline">
        documentation
      </nuxt-link> for more details.
    </p>
  </section>
</template>

<script setup lang="ts">
const { createActionHandler } = useActionIcon()
const copyIcon = createActionHandler("ph:copy-bold")

const openIndex = ref<number | null>(null)

function toggleAccordion(index: number) {
  openIndex.value = openIndex.value === index ? null : index
}

useHead({
  title: "Securely Manage Your Environment Variables",
  link: [{ rel: "canonical", href: "https://secretkeepr.vercel.app" }],
  meta: [{ name: "description", content: "Centralize, encrypt, and share your secrets with confidence. Fast, safe, and easy to use." }],
})

definePageMeta({
  middleware: guest,
})
</script>

<style scoped>
.hero-backdrop {
  background: linear-gradient(360deg, var(--background) 20%, var(--primary) 80%, var(--secondary) 100%);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-origin: top;
  animation: gradientGrow 10s ease-in-out infinite;
}

@keyframes gradientGrow {
  0% {
    transform: scaleY(0.5);
    opacity: 0.1;
  }
  50% {
    transform: scaleY(1);
    opacity: 0.2;
  }
  100% {
    transform: scaleY(0.5);
    opacity: 0.1;
  }
}

.hero-btn {
  box-shadow: 0 0 0 2px var(--primary);
  border-radius: 5rem;
}
.hero-btn:hover {
  box-shadow: 0 0 8px 2px var(--accent);
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
</style>
