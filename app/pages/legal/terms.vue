<template>
  <ContentRenderer v-if="pageContent" :value="pageContent" />
</template>

<script setup lang="ts">
const pageContent = await queryCollection("content").path("/terms-of-service").first()

useHead({
  title: "Terms of Service",
  link: [{ rel: "canonical", href: "https://secretkeepr.vercel.app/legal/terms" }],
  meta: [{ name: "description", content: "SecretkeepR Terms of Service." }],
})

definePageMeta({
  layout: "content",
})
</script>
