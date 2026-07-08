<template>
  <h1>
    {{ CLI_PAGES[slug]?.title }}
  </h1>

  <div v-for="(section, index) in CLI_PAGES[slug]?.content" :key="index">
    <h2 :id="slugify(section.title)">
      {{ section.title }}
    </h2>

    <p v-for="(para, pIdx) in section.paragraphs" :key="`p-${pIdx}`">
      <template v-for="(part, partIdx) in para" :key="partIdx">
        <span v-if="typeof part === 'string'">{{ part }}</span>
        <code v-else-if="'code' in part">{{ part.code }}</code>
        <strong v-else-if="'strong' in part">{{ part.strong }}</strong>
        <em v-else-if="'em' in part">{{ part.em }}</em>
        <nuxt-link v-else-if="'link' in part" :to="part.link.href">
          {{ part.link.text }}
        </nuxt-link>
      </template>
    </p>

    <p v-if="section.note">
      <em>
        <template v-for="(part, partIdx) in section.note" :key="partIdx">
          <span v-if="typeof part === 'string'">{{ part }}</span>
          <code v-else-if="'code' in part">{{ part.code }}</code>
        </template>
      </em>
    </p>

    <div v-for="(block, bIdx) in section.code" :key="`code-${bIdx}`" class="flex flex-col">
      <p v-if="block.label">
        <strong>{{ block.label }}</strong>
      </p>
      <Shiki v-if="block.command" lang="bash" :code="block.command" class="code-block" />
      <Shiki v-if="block.output" lang="bash" :code="block.output" class="code-block" />
    </div>

    <template v-for="(group, gIdx) in groupCommandOptions(section.commands)" :key="`opts-${gIdx}`">
      <p>
        <strong>{{ group.label }}:</strong>
      </p>
      <ul>
        <li v-for="(item, iIdx) in group.items" :key="iIdx">
          <code>{{ item.code }}</code>: {{ item.description }}
        </li>
      </ul>
    </template>

    <ul v-if="section.commands?.some(c => !c.code)">
      <li v-for="(item, lIdx) in section.commands?.filter(c => !c.code) ?? []" :key="lIdx">
        <strong v-if="item.label">{{ item.label }}: </strong>
        <template v-if="item.description">
          {{ item.description }}
        </template>
      </li>
    </ul>

    <ul v-if="section.links?.length">
      <li v-for="(link, lIdx) in section.links" :key="lIdx">
        <nuxt-link :to="link.href">
          <strong>{{ link.label }}</strong>
        </nuxt-link>:
        {{ link.description }}
      </li>
    </ul>

    <ol v-if="section.steps">
      <li v-for="(step, sIdx) in section.steps" :key="sIdx">
        {{ step }}
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const route = useRoute()
const param = route.params.slug as string | string[]
const slug = (Array.isArray(param) ? param.join("/") : param) || "index"

type CommandOption = NonNullable<CliSection["commands"]>[number]

function groupCommandOptions(commands?: CliSection["commands"]) {
  if (!commands?.length) {
    return []
  }

  const groups: { label: string, items: CommandOption[] }[] = []

  for (const item of commands) {
    if (!item.code) {
      continue
    }

    const label = item.label || "Options"
    const group = groups.find(entry => entry.label === label)
    if (group) {
      group.items.push(item)
    }
    else {
      groups.push({ label, items: [item] })
    }
  }

  return groups
}

useHead({
  title: CLI_PAGES[slug]?.title,
  link: [{ rel: "canonical", href: `${baseURL}/cli-guide/${slug === "index" ? "" : slug}` }],
  meta: [{ name: "description", content: CLI_PAGES[slug]?.description }],
})

definePageMeta({ layout: "content" })
</script>
