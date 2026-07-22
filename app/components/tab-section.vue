<template>
  <section class="container mx-auto flex flex-col">
    <header v-if="title" class="flex flex-col items-start gap-2 border-b py-2 md:flex-row md:items-center md:justify-between md:px-2">
      <div class="flex flex-col gap-1">
        <div class="navigation-group">
          <template v-if="$slots.context || context">
            <slot name="context">
              <h3 class="max-w-lg truncate text-muted-foreground">
                {{ context }}
              </h3>
            </slot>
            <icon name="ph:caret-right-bold" size="15" class="shrink-0 text-muted-foreground" />
          </template>

          <h3 class="truncate">
            {{ title }}
          </h3>
        </div>
      </div>

      <div class="w-full md:w-auto">
        <slot name="actions" />
      </div>
    </header>

    <div class="md:px-4 2xl:px-8">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  context?: string
}>()
</script>
