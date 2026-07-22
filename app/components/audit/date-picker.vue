<template>
  <div ref="datePickerRef" class="relative">
    <button type="button" class="btn" @click="isDatePickerOpen = !isDatePickerOpen">
      <span>{{ displayLabel }}</span>
      <icon name="ph:caret-down-bold" size="15" />
    </button>

    <transition name="dropdown">
      <div v-if="isDatePickerOpen" class="dropdown-menu right-auto! left-0! max-h-none! w-72 max-w-[calc(100vw-1rem)] space-y-2" role="dialog" aria-label="Select date range">
        <div class="navigation-group justify-between">
          <select v-model="currentMonth" aria-label="Month">
            <option v-for="(month, idx) in months" :key="idx" :value="idx">
              {{ month }}
            </option>
          </select>
          <select v-model="currentYear" aria-label="Year">
            <option v-for="year in years" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>

        <div class="flex flex-row items-center justify-between px-1 text-xs">
          <span v-if="!modelValue?.start">Select start date</span>
          <span v-else-if="!modelValue?.end">Select end date</span>
          <span v-else>Date range selected</span>

          <div class="navigation-group gap-1">
            <button v-if="modelValue?.start" type="button" class="btn-warning p-1! text-xs!" @click="emit('update:modelValue', {})">
              Clear range
            </button>
            <button type="button" class="btn-info p-1! text-xs!" @click="handleApply">
              Apply
            </button>
          </div>
        </div>

        <div class="grid grid-cols-7 gap-1">
          <span v-for="day in weekDays" :key="day" class="text-center text-xs font-medium text-muted-foreground">{{ day }}</span>
        </div>

        <div class="grid grid-cols-7 gap-1">
          <button
            v-for="day in calendarDays" :key="`${day.date}-${day.isCurrentMonth}`"
            type="button"
            :aria-label="`${day.isStart ? 'Start: ' : day.isEnd ? 'End: ' : ''}${day.date.toLocaleDateString('en-GB')}`"
            class="aspect-square rounded-lg text-xs transition-colors" :class="{ 'bg-secondary': day.isInRange, 'bg-info': day.isStart || day.isEnd, 'hover:bg-muted': day.isCurrentMonth, 'text-muted-foreground opacity-50': !day.isCurrentMonth }"
            :disabled="!day.isCurrentMonth" @mouseenter="hoverDate = day.date"
            @mouseleave="hoverDate = null" @click="selectDate(day)"
          >
            {{ day.day }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue?: { start?: string, end?: string }
}>()

const emit = defineEmits<{ "update:modelValue": [{ start?: string, end?: string }], "apply": [] }>()

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const datePickerRef = ref<HTMLElement | null>(null)
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
const hoverDate = ref<Date | null>(null)
const isDatePickerOpen = ref(false)
useClickOutside(datePickerRef, () => isDatePickerOpen.value = false, { escapeKey: true })
const startDate = computed(() => parseDate(props.modelValue?.start))
const endDate = computed(() => parseDate(props.modelValue?.end))
const years = computed(() => Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i))

const displayLabel = computed(() => {
  const format = (date?: string) => date ? parseDate(date)!.toLocaleDateString("en-GB") : ""
  const { start, end } = props.modelValue ?? {}
  if (!start) {
    return "Date"
  }
  if (!end) {
    return `From ${format(start)}`
  }

  return start === end ? `On ${format(start)}` : `${format(start)} → ${format(end)}`
})

const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const prevLastDay = new Date(currentYear.value, currentMonth.value, 0)
  const days: any[] = []

  for (let i = firstDay.getDay() - 1; i >= 0; i--) {
    days.push({ date: new Date(currentYear.value, currentMonth.value - 1, prevLastDay.getDate() - i), day: prevLastDay.getDate() - i, isCurrentMonth: false })
  }
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push({ date: new Date(currentYear.value, currentMonth.value, day), day, isCurrentMonth: true })
  }

  while (days.length < 42) {
    const day = days.length - lastDay.getDate() - firstDay.getDay() + 1
    days.push({ date: new Date(currentYear.value, currentMonth.value + 1, day), day, isCurrentMonth: false })
  }

  return days.map((d) => {
    const time = d.date.getTime()
    const isStart = startDate.value?.getTime() === time
    const isEnd = endDate.value?.getTime() === time
    const effectiveEnd = endDate.value || (startDate.value && hoverDate.value && hoverDate.value > startDate.value ? hoverDate.value : null)
    const isInRange = startDate.value && effectiveEnd && time > startDate.value.getTime() && time < effectiveEnd.getTime()

    return { ...d, isStart, isEnd, isInRange }
  })
})

function parseDate(date?: string) {
  if (!date) {
    return null
  }

  const [y, m, d] = date.split("-").map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}

function selectDate(day: { date: Date, isCurrentMonth: boolean }) {
  if (!day.isCurrentMonth) {
    return
  }

  const y = day.date.getFullYear()
  const m = String(day.date.getMonth() + 1).padStart(2, "0")
  const d = String(day.date.getDate()).padStart(2, "0")
  const selected = `${y}-${m}-${d}`
  if (!props.modelValue?.start || props.modelValue.end) {
    emit("update:modelValue", { start: selected })
  }
  else {
    const start = parseDate(props.modelValue.start)!
    emit("update:modelValue", day.date < start ? { start: selected, end: props.modelValue.start } : { start: props.modelValue.start, end: selected })
  }
}

function handleApply() {
  emit("apply")
  isDatePickerOpen.value = false
}
</script>
