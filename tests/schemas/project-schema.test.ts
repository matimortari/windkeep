import { describe, expect, it } from "vitest"
import { addProjectMemberSchema, createProjectSchema, updateProjectMemberSchema, updateProjectSchema } from "../../shared/schemas/project-schema"

describe("createProjectSchema", () => {
  it("accepts a valid project", () => {
    expect(createProjectSchema.parse({
      name: "  WindKeep  ",
      description: "  Secrets manager  ",
      website: "https://example.com",
      orgId: "tz4a98xxat96iws9zmbrgj3a",
    })).toMatchObject({
      name: "WindKeep",
      description: "Secrets manager",
      website: "https://example.com",
      orgId: "tz4a98xxat96iws9zmbrgj3a",
    })
  })

  it("rejects names that are too short", () => {
    expect(createProjectSchema.safeParse({ name: "ab", orgId: "tz4a98xxat96iws9zmbrgj3a" }).success).toBe(false)
  })

  it("rejects names that trim below the minimum length", () => {
    expect(createProjectSchema.safeParse({ name: "  ab  ", orgId: "tz4a98xxat96iws9zmbrgj3a" }).success).toBe(false)
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

  it("clears description and website when null", () => {
    expect(updateProjectSchema.parse({ description: null, website: null })).toEqual({ description: null, website: null })
  })
})

describe("addProjectMemberSchema", () => {
  it("defaults role to MEMBER and accepts environments", () => {
    expect(addProjectMemberSchema.parse({
      userId: "tz4a98xxat96iws9zmbrgj3a",
      environment: ["DEVELOPMENT", "STAGING"],
    })).toEqual({
      userId: "tz4a98xxat96iws9zmbrgj3a",
      role: "MEMBER",
      environment: ["DEVELOPMENT", "STAGING"],
    })
  })

  it("rejects empty environments", () => {
    expect(addProjectMemberSchema.safeParse({
      userId: "tz4a98xxat96iws9zmbrgj3a",
      environment: [],
    }).success).toBe(false)
  })
})

describe("updateProjectMemberSchema", () => {
  it("accepts environment-only updates", () => {
    expect(updateProjectMemberSchema.parse({ environment: ["PRODUCTION"] })).toEqual({
      environment: ["PRODUCTION"],
    })
  })

  it("requires role or environment", () => {
    expect(updateProjectMemberSchema.safeParse({}).success).toBe(false)
  })
})
