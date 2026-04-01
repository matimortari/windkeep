<template>
  <section
    id="hero" v-motion
    :initial="{ opacity: 0 }" :visible-once="{ opacity: 1 }"
    :duration="800" class="relative flex min-h-screen w-full flex-col items-center justify-center border-b px-4"
  >
    <div class="backdrop" />
    <div class="dot-overlay" />

    <header class="z-20 flex w-full max-w-4xl flex-col gap-4">
      <div class="h-1 w-15 bg-primary" />

      <h1 class="hero-heading">
        Your Secrets, Secured.
      </h1>

      <p class="max-w-2xl leading-6 font-semibold text-muted-foreground md:text-lg">
        No more .env headaches — WindKeep is a secrets management platform
        that helps organizations securely store, manage, and share sensitive information.
      </p>

      <div class="navigation-group">
        <nuxt-link to="/sign-in" class="group btn rounded-full! bg-linear-to-r from-primary to-secondary text-surface-foreground! shadow-lg shadow-primary/30 transition-all hover:shadow-primary/40">
          <span class="font-semibold">Get Started</span>
          <icon name="ph:arrow-right-bold" size="20" />
        </nuxt-link>
        <nuxt-link to="/cli-guide" class="btn-ghost group rounded-full! hover:border-primary/50!">
          <icon name="ph:terminal-bold" size="20" class="text-primary" />
          <span>WindKeep CLI</span>
        </nuxt-link>
      </div>

      <div class="flex flex-wrap items-center gap-4 py-8">
        <div
          v-for="(highlight, index) in HIGHLIGHTS" :key="index"
          v-motion :initial="{ opacity: 0 }"
          :visible-once="{ opacity: 1 }" :duration="600"
          :delay="150 * index" class="navigation-group text-sm font-semibold text-muted-foreground"
        >
          <icon :name="highlight.icon" class="text-primary" size="20" />
          <span>{{ highlight.title }}</span>
        </div>
      </div>
    </header>
  </section>

  <div class="container mx-auto flex w-full flex-col gap-12 px-4 py-20 md:max-w-6xl md:gap-20">
    <section id="cli" class="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-0">
      <header class="flex flex-col gap-4 md:border-r md:pr-12">
        <div class="flex items-end justify-between border-b pb-4">
          <h2>
            WindKeep CLI
          </h2>
          <p class="section-label hidden md:block">
            Command-line secrets management
          </p>
        </div>

        <p class="font-medium text-muted-foreground">
          Manage secrets and projects directly from your terminal. Fast, secure, and open-source.
          Read the
          <nuxt-link to="/cli-guide" class="text-primary hover:underline">
            documentation
          </nuxt-link>
          for more details.
        </p>

        <ul class="flex flex-col gap-2">
          <li v-for="bullet in CLI_BULLETS" :key="bullet.description" class="text-caption navigation-group">
            <span class="text-primary">—</span>
            <span>{{ bullet.description }}</span>
          </li>
        </ul>
      </header>

      <div class="card p-0! md:ml-8">
        <div class="flex flex-row border-b">
          <button
            v-for="tab in CLI_TABS" :key="tab.key"
            class="cli-tab" :class="activeTab === tab.key ? 'cli-tab--active' : ''"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-if="currentTab" class="space-y-2 p-4">
          <p class="text-caption">
            > {{ currentTab.description }}
          </p>
          <Shiki lang="bash" :code="currentTab.code.join('\n')" class="code-block" />
        </div>
      </div>
    </section>

    <section
      id="features" v-motion
      :initial="{ opacity: 0, y: 20 }" :visible-once="{ opacity: 1, y: 0 }"
      :duration="800"
    >
      <div class="flex items-end justify-between border-b pb-4">
        <h2>
          Features
        </h2>
        <p class="section-label hidden md:block">
          What WindKeep offers
        </p>
      </div>

      <div class="grid grid-cols-1 border-b md:grid-cols-2">
        <div
          v-for="(feature, index) in FEATURES" :key="index"
          v-motion :initial="{ opacity: 0 }"
          :visible-once="{ opacity: 1 }" :duration="600"
          :delay="100 * index" class="feature-item"
          :class="{ 'border-b': index < FEATURES.length - 2, 'max-md:border-b': index === FEATURES.length - 2, 'md:border-l': index % 2 === 1 }"
        >
          <div class="flex flex-col gap-2">
            <div class="navigation-group">
              <icon :name="feature.icon" class="text-primary" size="25" />
              <h3 class="text-base! leading-none! font-bold">
                {{ feature.title }}
              </h3>
            </div>
            <p class="text-caption">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section
      id="faq" v-motion
      :initial="{ opacity: 0, y: 20 }" :visible-once="{ opacity: 1, y: 0 }"
      :duration="800"
    >
      <div class="flex items-end justify-between border-b pb-4">
        <h2>
          FAQ
        </h2>
        <p class="section-label hidden md:block">
          Frequently Asked Questions
        </p>
      </div>

      <div class="flex flex-col divide-y">
        <div v-for="(item, index) in FAQS" :key="index" class="py-4">
          <button
            class="group flex w-full items-start justify-between gap-4 text-left font-semibold transition-colors hover:text-primary"
            @click="openIndex = openIndex === index ? null : index"
          >
            <span class="text-sm md:text-base">{{ item.question }}</span>
            <icon name="ph:plus-bold" size="20" class="mt-0.5 shrink-0 transition-transform" :class="openIndex === index ? 'rotate-45 text-primary' : 'text-muted-foreground'" />
          </button>

          <transition name="accordion">
            <p v-if="openIndex === index" class="text-caption max-w-4xl">
              {{ item.answer }}
            </p>
          </transition>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const openIndex = ref<number | null>(null)
const activeTab = ref(CLI_TABS[0]?.key)
const currentTab = computed(() => CLI_TABS.find(t => t.key === activeTab.value))

useHead({
  title: "Securely Manage Your Environment Variables",
  link: [{ rel: "canonical", href: `${baseURL}` }],
  meta: [{ name: "description", content: "WindKeep is a secrets management platform that helps users and teams securely store, manage, and share sensitive information." }],
})

definePageMeta({ middleware: "guest" })
</script>

<style scoped>
h1,
h2 {
  font-family: var(--font-display);
}

.hero-heading {
  font-size: clamp(1.5rem, 3.75vw, 3.375rem);
  line-height: 1.05;
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image: url("@/assets/backdrop.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  mask-image: radial-gradient(ellipse at center, black 80%, transparent 100%);
  filter: brightness(0.3);
}
html.light .backdrop {
  opacity: 0;
}

.dot-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background-image: radial-gradient(
    circle,
    color-mix(in srgb, var(--foreground) 25%, transparent) 2px,
    transparent 2px
  );
  background-size: 10px 10px;
  mask-image: linear-gradient(135deg, black 0%, transparent 50%, transparent 70%, black 100%);
  -webkit-mask-image: linear-gradient(135deg, black 0%, transparent 50%, transparent 70%, black 100%);
}

.cli-tab {
  flex: 1;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
  background: transparent;
  color: var(--muted-foreground);
  border: none;
  border-right: var(--border-style);
  transition: all var(--transition);
}
.cli-tab:last-child {
  border-right: none;
}
.cli-tab--active {
  background-color: color-mix(in srgb, var(--muted) 30%, transparent);
  color: var(--foreground);
  border-bottom: 2px solid var(--primary);
}
.cli-tab:not(.cli-tab--active):hover {
  background-color: color-mix(in srgb, var(--muted) 20%, transparent);
}

.feature-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 2rem 1rem;
  transition: background-color var(--transition);
}
@media (min-width: 768px) {
  .feature-item:nth-child(even) {
    padding-left: 3rem;
  }
}

.accordion-enter-active,
.accordion-leave-active {
  transition:
    max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.25s ease;
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
