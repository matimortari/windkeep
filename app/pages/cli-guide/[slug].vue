<template>
  <ContentRenderer v-if="pageContent" :value="pageContent" />
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
const pageContent = await queryCollection("content").path(`/cli-${slug}`).first()

const PAGE_TITLES: Record<string, string> = {
  organizations: "Organizations",
  projects: "Projects",
  secrets: "Secrets Management",
  guides: "Guides & Troubleshooting",
}

const PAGE_DESCRIPTIONS: Record<string, string> = {
  organizations: "Managing organizations and teams with the WindKeep CLI.",
  projects: "Managing projects and configurations with the WindKeep CLI.",
  secrets: "Managing secrets and running commands with the WindKeep CLI.",
  guides: "Comprehensive guides and troubleshooting for the WindKeep CLI.",
}

useHead({
  title: `CLI – ${PAGE_TITLES[slug]}`,
  link: [{ rel: "canonical", href: `${BASE_URL}/cli/${slug}` }],
  meta: [{ name: "description", content: PAGE_DESCRIPTIONS[slug] }],
})

definePageMeta({
  layout: "content",
})
</script>
