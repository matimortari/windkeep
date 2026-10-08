import { describe, expect, it } from "vitest"
import { createInviteSchema, createOrgSchema, getAuditLogsSchema, updateOrgSchema } from "../../shared/schemas/org-schema"

const CUID2 = "tz4a98xxat96iws9zmbrgj3a"

describe("createOrgSchema", () => {
  it("accepts a minimal AUTO org", () => {
    const result = createOrgSchema.parse({ name: "Acme Corp" })
    expect(result.name).toBe("Acme Corp")
    expect(result.encryptionMode).toBe("AUTO")
  })

  it("requires a long enough encryption password in MANUAL mode", () => {
    expect(createOrgSchema.safeParse({
      name: "Acme Corp",
      encryptionMode: "MANUAL",
      encryptionKey: "short",
    }).success).toBe(false)

    expect(createOrgSchema.safeParse({
      name: "Acme Corp",
      encryptionMode: "MANUAL",
      encryptionKey: "long-enough-password",
    }).success).toBe(true)
  })

  it("rejects invalid websites", () => {
    expect(createOrgSchema.safeParse({ name: "Acme Corp", website: "not-a-url" }).success).toBe(false)
  })
})

describe("updateOrgSchema", () => {
  it("validates MANUAL encryption key when rotating", () => {
    expect(updateOrgSchema.safeParse({
      rotateEncryptionKey: true,
      encryptionMode: "MANUAL",
      encryptionKey: "short",
    }).success).toBe(false)
  })
})

describe("getAuditLogsSchema", () => {
  it("applies pagination defaults", () => {
    expect(getAuditLogsSchema.parse({})).toMatchObject({ page: 1, limit: 20 })
  })

  it("rejects inverted date ranges", () => {
    expect(getAuditLogsSchema.safeParse({
      startDate: "2024-02-01T00:00:00.000Z",
      endDate: "2024-01-01T00:00:00.000Z",
    }).success).toBe(false)
  })
})

describe("createInviteSchema", () => {
  it("accepts a valid invite", () => {
    expect(createInviteSchema.parse({
      orgId: CUID2,
      email: "ada@example.com",
    })).toMatchObject({ role: "MEMBER" })
  })

  it("rejects invalid emails", () => {
    expect(createInviteSchema.safeParse({
      orgId: CUID2,
      email: "not-an-email",
    }).success).toBe(false)
  })
})
