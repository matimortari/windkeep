import { describe, expect, it } from "vitest"
import { createServiceTokenSchema } from "../../shared/schemas/service-token-schema"

const CUID2 = "tz4a98xxat96iws9zmbrgj3a"

describe("createServiceTokenSchema", () => {
  it("accepts a valid token", () => {
    expect(createServiceTokenSchema.parse({
      name: "  CI Token  ",
      projectId: CUID2,
      environment: ["DEVELOPMENT", "PRODUCTION"],
      expiresInDays: 30,
    })).toMatchObject({
      name: "CI Token",
      projectId: CUID2,
      environment: ["DEVELOPMENT", "PRODUCTION"],
      expiresInDays: 30,
    })
  })

  it("requires at least one environment", () => {
    expect(createServiceTokenSchema.safeParse({
      name: "CI Token",
      projectId: CUID2,
      environment: [],
    }).success).toBe(false)
  })

  it("rejects expirations over one year", () => {
    expect(createServiceTokenSchema.safeParse({
      name: "CI Token",
      projectId: CUID2,
      environment: ["STAGING"],
      expiresInDays: 400,
    }).success).toBe(false)
  })
})
