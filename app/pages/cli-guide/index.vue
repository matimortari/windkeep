<template>
  <ContentRenderer v-if="pageContent" :value="pageContent" />
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const pageContent = await queryCollection("content").path("/cli").first()

useHead({
  title: "Command Line Interface",
  link: [{ rel: "canonical", href: `${baseURL}/cli` }],
  meta: [{ name: "description", content: "WindKeep Command Line Interface." }],
})

definePageMeta({
  layout: "content",
})
</script>
