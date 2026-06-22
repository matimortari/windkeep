import type { ComputedRef, Ref } from "vue"
import { computed, readonly, ref } from "vue"

export function useTableSort<T extends Record<string, any>>(data: Ref<T[]> | ComputedRef<T[]>) {
  const sortKey = ref<string | null>(null)
  const sortDirection = ref<"asc" | "desc" | null>(null)

  const sortedData = computed(() => {
    if (!sortKey.value || !sortDirection.value) {
      return data.value
    }

    return data.value.toSorted((a, b) => {
      const A = sortKey.value?.split(".").reduce((cur: any, k: string) => cur?.[k], a)
      const B = sortKey.value?.split(".").reduce((cur: any, k: string) => cur?.[k], b)

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

  function toggleSort(key: string) {
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

  function setSort(key: string, direction: "asc" | "desc" | null) {
    sortKey.value = key
    sortDirection.value = direction
  }

  function isSorted(key: string): "asc" | "desc" | null {
    return sortKey.value === key ? sortDirection.value : null
  }

  function getSortIcon(key: string) {
    return isSorted(key)
  }

  function getSortIconName(key: string) {
    if (getSortIcon(key) === "asc") {
      return "ph:caret-up-bold"
    }
    if (getSortIcon(key) === "desc") {
      return "ph:caret-down-bold"
    }

    return "ph:caret-up-down-bold"
  }

  return {
    sortKey: readonly(sortKey),
    sortDirection: readonly(sortDirection),
    sortedData,
    toggleSort,
    setSort,
    isSorted,
    getSortIcon,
    getSortIconName,
  }
}
