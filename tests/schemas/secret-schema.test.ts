import { describe, expect, it } from "vitest"
import { createSecretSchema, updateSecretSchema, updateSecretValueSchema } from "../../shared/schemas/secret-schema"

const CUID2 = "tz4a98xxat96iws9zmbrgj3a"

describe("createSecretSchema", () => {
  it("accepts a valid secret key", () => {
    expect(createSecretSchema.parse({
      key: "API_KEY",
      description: "  Primary API key  ",
      projectId: CUID2,
    })).toMatchObject({
      key: "API_KEY",
      description: "Primary API key",
      tags: [],
      projectId: CUID2,
    })
  })

  it("rejects lowercase or punctuation in keys", () => {
    expect(createSecretSchema.safeParse({ key: "api-key", projectId: CUID2 }).success).toBe(false)
  })

  it("rejects keys that start or end with an underscore", () => {
    expect(createSecretSchema.safeParse({ key: "_API_KEY", projectId: CUID2 }).success).toBe(false)
    expect(createSecretSchema.safeParse({ key: "API_KEY_", projectId: CUID2 }).success).toBe(false)
  })

  it("rejects consecutive underscores", () => {
    expect(createSecretSchema.safeParse({ key: "API__KEY", projectId: CUID2 }).success).toBe(false)
  })

  it("accepts environment values when provided", () => {
    expect(createSecretSchema.parse({
      key: "DB_URL",
      projectId: CUID2,
      values: [{ environment: "DEVELOPMENT", value: "postgres://localhost" }],
    }).values).toHaveLength(1)
  })
})

describe("updateSecretSchema", () => {
  it("allows clearing description", () => {
    expect(updateSecretSchema.parse({ description: null })).toEqual({ description: null })
  })

  it("trims description updates", () => {
    expect(updateSecretSchema.parse({ description: "  Updated  " })).toEqual({ description: "Updated" })
  })
})

describe("updateSecretValueSchema", () => {
  it("requires a non-empty value", () => {
    expect(updateSecretValueSchema.safeParse({ value: "" }).success).toBe(false)
    expect(updateSecretValueSchema.parse({ value: "secret" })).toEqual({ value: "secret" })
  })
})
