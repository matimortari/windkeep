import { describe, expect, it } from "vitest"
import { createSecretSchema, updateSecretSchema, updateSecretValueSchema } from "../../shared/schemas/secret-schema"

describe("createSecretSchema", () => {
  it("accepts a valid secret key", () => {
    expect(createSecretSchema.parse({ key: "API_KEY", description: "  Primary API key  ", projectId: "tz4a98xxat96iws9zmbrgj3a" })).toMatchObject({ key: "API_KEY", description: "Primary API key", tags: [], projectId: "tz4a98xxat96iws9zmbrgj3a" })
  })

  it("rejects lowercase or punctuation in keys", () => {
    expect(createSecretSchema.safeParse({ key: "api-key", projectId: "tz4a98xxat96iws9zmbrgj3a" }).success).toBe(false)
  })

  it("rejects keys that start or end with an underscore", () => {
    expect(createSecretSchema.safeParse({ key: "_API_KEY", projectId: "tz4a98xxat96iws9zmbrgj3a" }).success).toBe(false)
    expect(createSecretSchema.safeParse({ key: "API_KEY_", projectId: "tz4a98xxat96iws9zmbrgj3a" }).success).toBe(false)
  })

  it("rejects consecutive underscores", () => {
    expect(createSecretSchema.safeParse({ key: "API__KEY", projectId: "tz4a98xxat96iws9zmbrgj3a" }).success).toBe(false)
  })

  it("accepts environment values when provided", () => {
    expect(createSecretSchema.parse({ key: "DB_URL", projectId: "tz4a98xxat96iws9zmbrgj3a", values: [{ environment: "DEVELOPMENT", value: "postgres://localhost" }] }).values).toHaveLength(1)
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
