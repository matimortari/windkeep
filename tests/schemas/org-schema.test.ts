import { describe, expect, it } from "vitest"
import { createInviteSchema, createOrgSchema, getAuditLogsSchema, updateOrgSchema } from "../../shared/schemas/org-schema"

describe("createOrgSchema", () => {
  it("accepts a minimal org", () => {
    const result = createOrgSchema.parse({ name: "Acme Corp" })
    expect(result.name).toBe("Acme Corp")
  })

  it("rejects invalid websites", () => {
    expect(createOrgSchema.safeParse({ name: "Acme Corp", website: "not-a-url" }).success).toBe(false)
  })
})

describe("updateOrgSchema", () => {
  it("accepts rotateEncryptionKey", () => {
    expect(updateOrgSchema.safeParse({ rotateEncryptionKey: true }).success).toBe(true)
  })

  it("clears description and website when null", () => {
    expect(updateOrgSchema.parse({ description: null, website: null })).toEqual({ description: null, website: null })
  })
})

describe("getAuditLogsSchema", () => {
  it("applies pagination defaults", () => {
    expect(getAuditLogsSchema.parse({})).toMatchObject({ page: 1, limit: 20 })
  })

  it("rejects inverted date ranges", () => {
    expect(getAuditLogsSchema.safeParse({ startDate: "2024-02-01T00:00:00.000Z", endDate: "2024-01-01T00:00:00.000Z" }).success).toBe(false)
  })
})

describe("createInviteSchema", () => {
  it("accepts a valid invite", () => {
    expect(createInviteSchema.parse({ orgId: "tz4a98xxat96iws9zmbrgj3a", email: "ada@example.com" })).toMatchObject({ role: "MEMBER" })
  })

  it("rejects invalid emails", () => {
    expect(createInviteSchema.safeParse({ orgId: "tz4a98xxat96iws9zmbrgj3a", email: "not-an-email" }).success).toBe(false)
  })
})
