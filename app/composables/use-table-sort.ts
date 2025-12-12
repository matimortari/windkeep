export function useTableSort<T extends Record<string, any>>(data: Ref<T[]> | ComputedRef<T[]>) {
  const sortKey = ref<keyof T | string | null>(null)
  const sortDirection = ref<"asc" | "desc" | null>(null)

  function getNestedValue(obj: T, path: string): any {
    return path.split(".").reduce((cur, k) => cur?.[k], obj as any)
  }

  const sortedData = computed(() => {
    if (!sortKey.value || !sortDirection.value) {
      return data.value
    }

    return [...data.value].sort((a, b) => {
      const A = getNestedValue(a, sortKey.value as string)
      const B = getNestedValue(b, sortKey.value as string)

      if (A == null && B == null) {
        return 0
      }
      if (A == null) {
        return sortDirection.value === "asc" ? 1 : -1
      }
      if (B == null) {
        return sortDirection.value === "asc" ? -1 : 1
      }

      if (typeof A === "string" && typeof B === "string") {
        const cmp = A.toLowerCase().localeCompare(B.toLowerCase())
        return sortDirection.value === "asc" ? cmp : -cmp
      }

      if (A instanceof Date && B instanceof Date) {
        const cmp = A.getTime() - B.getTime()
        return sortDirection.value === "asc" ? cmp : -cmp
      }

      if (A < B) {
        return sortDirection.value === "asc" ? -1 : 1
      }
      if (A > B) {
        return sortDirection.value === "asc" ? 1 : -1
      }
      return 0
    })
  })

  function toggleSort(key: keyof T | string) {
    if (sortKey.value === key) {
      if (sortDirection.value === "asc") {
        sortDirection.value = "desc"
      }
      else if (sortDirection.value === "desc") {
        sortDirection.value = null
        sortKey.value = null
      }
    }
    else {
      sortKey.value = key
      sortDirection.value = "asc"
    }
  }

  function setSort(key: keyof T | string, direction: "asc" | "desc" | null) {
    sortKey.value = key
    sortDirection.value = direction
  }

  function clearSort() {
    sortKey.value = null
    sortDirection.value = null
  }

  function isSorted(key: keyof T | string): "asc" | "desc" | null {
    return sortKey.value === key ? sortDirection.value : null
  }

  function getSortIcon(key: keyof T | string) {
    return isSorted(key) // "asc" | "desc" | null
  }

  function getSortIconName(key: keyof T | string) {
    const state = getSortIcon(key)

    if (state === "asc") {
      return "ph:caret-up-bold"
    }

    if (state === "desc") {
      return "ph:caret-down-bold"
    }

    return "ph:caret-up-down"
  }

  return {
    sortKey: readonly(sortKey),
    sortDirection: readonly(sortDirection),
    sortedData,
    toggleSort,
    getNestedValue,
    setSort,
    clearSort,
    isSorted,
    getSortIcon,
    getSortIconName,
  }
}
