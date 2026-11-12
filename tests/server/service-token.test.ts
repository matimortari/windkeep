import { beforeEach, describe, expect, it } from "vitest"
import { extractServiceToken, hashToken, requireServiceToken } from "../../server/utils/helpers"
import { db, resetNitroMocks } from "../mocks/nitro-runtime"

describe("hashToken (service tokens)", () => {
  it("returns a stable sha256 hex digest for st_ tokens", () => {
    const first = hashToken("st_abc123")
    expect(first).toMatch(/^[a-f0-9]{64}$/)
    expect(hashToken("st_abc123")).toBe(first)
    expect(hashToken("st_other")).not.toBe(first)
  })
})

describe("extractServiceToken", () => {
  it("extracts Bearer st_ tokens and rejects other schemes", () => {
    expect(extractServiceToken("Bearer st_deadbeef")).toBe("st_deadbeef")
    expect(extractServiceToken("Bearer personal-token")).toBeNull()
    expect(extractServiceToken(undefined)).toBeNull()
  })
})

describe("requireServiceToken", () => {
  beforeEach(() => {
    resetNitroMocks()
  })

  it("returns the token and updates lastUsedAt", async () => {
    const token = {
      id: "tok-1",
      name: "CI",
      environment: ["PRODUCTION"],
      expiresAt: null,
      projectId: "proj-1",
      project: { id: "proj-1", name: "App", slug: "app", orgId: "org-1" },
    }
    db.serviceToken.findUnique.mockResolvedValue(token)

    await expect(requireServiceToken("st_deadbeef")).resolves.toEqual(token)
    expect(db.serviceToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashToken("st_deadbeef") },
      select: expect.any(Object),
    })
    expect(db.serviceToken.update).toHaveBeenCalledWith({
      where: { id: "tok-1" },
      data: { lastUsedAt: expect.any(Date) },
    })
  })

  it("rejects missing or expired tokens", async () => {
    db.serviceToken.findUnique.mockResolvedValue(null)
    await expect(requireServiceToken("st_missing")).rejects.toMatchObject({ statusCode: 401, statusMessage: "Invalid service token" })

    db.serviceToken.findUnique.mockResolvedValue({
      id: "tok-2",
      name: "Old",
      environment: ["DEVELOPMENT"],
      expiresAt: new Date(Date.now() - 1000),
      projectId: "proj-1",
      project: { id: "proj-1", name: "App", slug: "app", orgId: "org-1" },
    })
    await expect(requireServiceToken("st_expired")).rejects.toMatchObject({ statusCode: 401, statusMessage: "Service token has expired" })
  })
})
