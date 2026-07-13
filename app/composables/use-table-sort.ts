function getByPath(obj: Record<string, any>, path: string) {
  return path.split(".").reduce((cur: any, key) => cur?.[key], obj)
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) {
    return 0
  }
  if (a == null) {
    return 1
  }
  if (b == null) {
    return -1
  }
  if (typeof a === "string" && typeof b === "string") {
    return a.toLowerCase().localeCompare(b.toLowerCase())
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime()
  }
  return a < (b as any) ? -1 : a > (b as any) ? 1 : 0
}

export function useTableSort<T extends Record<string, any>>(data: Ref<T[]> | ComputedRef<T[]>) {
  const sortKey = ref<string | null>(null)
  const sortDirection = ref<"asc" | "desc" | null>(null)

  const sortedData = computed(() => {
    if (!sortKey.value || !sortDirection.value) {
      return data.value
    }

    const key = sortKey.value
    const dir = sortDirection.value === "asc" ? 1 : -1

    return data.value.toSorted((a, b) => dir * compareValues(getByPath(a, key), getByPath(b, key)))
  })

  function toggleSort(key: string) {
    if (sortKey.value !== key) {
      sortKey.value = key
      sortDirection.value = "asc"
      return
    }
    if (sortDirection.value === "asc") {
      sortDirection.value = "desc"
      return
    }
    sortKey.value = null
    sortDirection.value = null
  }

  function setSort(key: string, direction: "asc" | "desc" | null) {
    sortKey.value = key
    sortDirection.value = direction
  }

  function getSortIconName(key: string) {
    if (sortKey.value !== key || !sortDirection.value) {
      return "ph:caret-up-down-bold"
    }
    return sortDirection.value === "asc" ? "ph:caret-up-bold" : "ph:caret-down-bold"
  }

  return {
    sortKey: readonly(sortKey),
    sortDirection: readonly(sortDirection),
    sortedData,
    toggleSort,
    setSort,
    getSortIconName,
  }
}
