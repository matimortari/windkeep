<template>
  <h1>
    {{ CLI_PAGES[slug]?.title }}
  </h1>

  <div v-for="(section, index) in CLI_PAGES[slug]?.content" :key="index">
    <h2>
      {{ section.title }}
    </h2>

    <p v-for="(para, pIdx) in section.paragraphs" :key="pIdx" v-html="para" />

    <ul v-if="section.list">
      <li v-for="(item, lIdx) in section.list" :key="lIdx" v-html="item" />
    </ul>
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const route = useRoute()
const param = route.params.slug as string | string[]
const slug = (Array.isArray(param) ? param.join("/") : param) || "index"

const INDEX_CONTENT: { title: string, paragraphs: string[], list?: string[] }[] = [
  {
    title: "Getting Started",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    ],
    list: [
      "<code>windkeep login</code> &mdash; Authenticate your machine.",
      "<code>windkeep init</code> &mdash; Connect a local project.",
      "<code>windkeep env</code> &mdash; Output your secure environment.",
    ],
  },
]

const ORGANIZATIONS_CONTENT: { title: string, paragraphs: string[], list?: string[] }[] = [
  {
    title: "Organization Scopes",
    paragraphs: [
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    ],
  },
]

const PROJECTS_CONTENT: { title: string, paragraphs: string[], list?: string[] }[] = [
  {
    title: "Linking Projects",
    paragraphs: [
      "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra.",
      "Integer facilisis lacinia dui. Praesent id massa id nisl venenatis lacinia. Aenean sit amet justo.",
    ],
  },
]

const SECRETS_CONTENT: { title: string, paragraphs: string[], list?: string[] }[] = [
  {
    title: "Injecting Secrets at Runtime",
    paragraphs: [
      "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae.",
    ],
    list: [
      "Standard injection: <code>windkeep run -- npm start</code>",
      "Strict override: <code>windkeep run --strict -- npx prisma migrate</code>",
    ],
  },
]

const GUIDES_CONTENT: { title: string, paragraphs: string[], list?: string[] }[] = [
  {
    title: "Troubleshooting & CI/CD",
    paragraphs: [
      "Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui.",
      "Donec non enim in turpis pulvinar facilisis. Ut felis. Praesent dapibus, neque id cursus faucibus.",
    ],
  },
]

const CLI_PAGES: Record<string, { title: string, description: string, content: { title: string, paragraphs: string[], list?: string[] }[] }> = {
  index: { title: "Command Line Interface", description: "WindKeep Command Line Interface.", content: INDEX_CONTENT },
  organizations: { title: "CLI: Organizations", description: "Managing organizations and teams with the WindKeep CLI.", content: ORGANIZATIONS_CONTENT },
  projects: { title: "CLI: Projects", description: "Managing projects and configurations with the WindKeep CLI.", content: PROJECTS_CONTENT },
  secrets: { title: "CLI: Secrets Management", description: "Managing secrets and running commands with the WindKeep CLI.", content: SECRETS_CONTENT },
  guides: { title: "CLI: Guides & Troubleshooting", description: "Comprehensive guides and troubleshooting for the WindKeep CLI.", content: GUIDES_CONTENT },
}

useHead({
  title: CLI_PAGES[slug]?.title,
  link: [{ rel: "canonical", href: `${baseURL}/cli-guide${slug === "index" ? "" : `/${slug}`}` }],
  meta: [{ name: "description", content: CLI_PAGES[slug]?.description }],
})

definePageMeta({ layout: "content" })
</script>
