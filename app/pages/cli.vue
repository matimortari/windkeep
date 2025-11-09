<template>
  <ContentRenderer v-if="pageContent" :value="pageContent" />
</template>

<script setup lang="ts">
const pageContent = await queryCollection("content").path("/cli").first()

useHead({
  title: "Command Line Interface",
  link: [{ rel: "canonical", href: "https://secretkeepr.vercel.app/legal/cli" }],
  meta: [{ name: "description", content: "SecretkeepR Command Line Interface." }],
})

definePageMeta({
  layout: "content",
})
</script>
