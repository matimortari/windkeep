<template>
  <section class="container mx-auto flex min-w-0 flex-col">
    <header v-if="title" class="flex w-full min-w-0 flex-col gap-2 border-b py-4 md:flex-row md:items-center md:justify-between md:py-2">
      <div class="max-w-full min-w-0">
        <div class="navigation-group max-w-full min-w-0">
          <template v-if="$slots.context || context">
            <div class="min-w-0 overflow-hidden">
              <slot name="context">
                <h3 class="truncate text-muted-foreground">
                  {{ context }}
                </h3>
              </slot>
            </div>
            <icon name="ph:caret-right-bold" size="15" class="shrink-0 text-muted-foreground" />
          </template>

          <h3 class="shrink-0">
            {{ title }}
          </h3>
        </div>
      </div>

      <div class="w-full min-w-0 overflow-visible md:w-auto md:shrink-0">
        <slot name="actions" />
      </div>
    </header>

    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  context?: string
}>()
</script>
