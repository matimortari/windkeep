import { describe, expect, it } from "vitest"
import { createProjectSchema, updateProjectSchema } from "../../shared/schemas/project-schema"

const CUID2 = "tz4a98xxat96iws9zmbrgj3a"

describe("createProjectSchema", () => {
  it("accepts a valid project", () => {
    expect(createProjectSchema.parse({
      name: "  WindKeep  ",
      orgId: CUID2,
    })).toMatchObject({ name: "WindKeep", orgId: CUID2 })
  })

  it("rejects names that are too short", () => {
    expect(createProjectSchema.safeParse({ name: "ab", orgId: CUID2 }).success).toBe(false)
  })
})

describe("updateProjectSchema", () => {
  it("accepts a valid slug", () => {
    expect(updateProjectSchema.parse({ slug: "my-project" })).toEqual({ slug: "my-project" })
  })

  it("rejects invalid slugs", () => {
    expect(updateProjectSchema.safeParse({ slug: "My_Project" }).success).toBe(false)
  })
})
