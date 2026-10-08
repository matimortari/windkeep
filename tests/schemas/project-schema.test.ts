import { describe, expect, it } from "vitest"
import { createProjectSchema, updateProjectSchema } from "../../shared/schemas/project-schema"

const CUID2 = "tz4a98xxat96iws9zmbrgj3a"

describe("createProjectSchema", () => {
  it("accepts a valid project", () => {
    expect(createProjectSchema.parse({
      name: "  WindKeep  ",
      description: "  Secrets manager  ",
      website: "https://example.com",
      orgId: CUID2,
    })).toMatchObject({
      name: "WindKeep",
      description: "Secrets manager",
      website: "https://example.com",
      orgId: CUID2,
    })
  })

  it("rejects names that are too short", () => {
    expect(createProjectSchema.safeParse({ name: "ab", orgId: CUID2 }).success).toBe(false)
  })

  it("rejects names that trim below the minimum length", () => {
    expect(createProjectSchema.safeParse({ name: "  ab  ", orgId: CUID2 }).success).toBe(false)
  })
})

describe("updateProjectSchema", () => {
  it("accepts name, slug, description, and website updates", () => {
    expect(updateProjectSchema.parse({
      name: "  New Name  ",
      slug: "my-project",
      description: "  Updated  ",
      website: "https://example.com/project",
    })).toEqual({
      name: "New Name",
      slug: "my-project",
      description: "Updated",
      website: "https://example.com/project",
    })
  })

  it("rejects invalid slugs", () => {
    expect(updateProjectSchema.safeParse({ slug: "My_Project" }).success).toBe(false)
  })

  it("rejects names that trim below the minimum length", () => {
    expect(updateProjectSchema.safeParse({ name: "  ab  " }).success).toBe(false)
  })
})
