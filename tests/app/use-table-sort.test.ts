import { describe, expect, it } from "vitest"
import { useTableSort } from "../../app/composables/use-table-sort"

describe("useTableSort", () => {
  it("cycles sort direction and clears on the third toggle", () => {
    const data = ref([{ name: "Charlie", meta: { score: 2 } }, { name: "alice", meta: { score: 3 } }, { name: "Bob", meta: { score: 1 } }])
    const sort = useTableSort(data)

    expect(sort.getSortIconName("name")).toBe("ph:caret-up-down-bold")

    sort.toggleSort("name")
    expect(sort.sortDirection.value).toBe("asc")
    expect(sort.sortedData.value.map(r => r.name)).toEqual(["alice", "Bob", "Charlie"])
    expect(sort.getSortIconName("name")).toBe("ph:caret-up-bold")

    sort.toggleSort("name")
    expect(sort.sortDirection.value).toBe("desc")
    expect(sort.sortedData.value.map(r => r.name)).toEqual(["Charlie", "Bob", "alice"])
    expect(sort.getSortIconName("name")).toBe("ph:caret-down-bold")

    sort.toggleSort("name")
    expect(sort.sortKey.value).toBeNull()
    expect(sort.sortDirection.value).toBeNull()
    expect(sort.sortedData.value).toEqual(data.value)
  })

  it("sorts nested paths and pushes nulls to the end", () => {
    const data = ref([{ name: "a", meta: { score: null as number | null } }, { name: "b", meta: { score: 1 } }, { name: "c", meta: { score: 3 } }])
    const sort = useTableSort(data)

    sort.setSort("meta.score", "asc")
    expect(sort.sortedData.value.map(r => r.name)).toEqual(["b", "c", "a"])
  })
})
