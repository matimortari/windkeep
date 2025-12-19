<template>
  <ContentRenderer v-if="pageContent" :value="pageContent" />
</template>

<script setup lang="ts">
const pageContent = await queryCollection("content").path("/cli").first()

useHead({
  title: "Command Line Interface",
  link: [{ rel: "canonical", href: "https://windkeep.vercel.app/legal/cli" }],
  meta: [{ name: "description", content: "WindKeep Command Line Interface." }],
})

definePageMeta({
  layout: "content",
})
</script>
