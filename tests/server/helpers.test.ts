import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createAuditLog, generateSlug, generateToken, getBinaryBlobUrl, getInviteBaseUrl, getUserFromSession, hashToken, invalidateOrgProjectCaches, requireEnv, requireRole } from "../../server/utils/helpers"
import { db, deleteCached, getHeader, getUserSession, resetNitroMocks } from "../mocks/nitro-runtime"

const TEST_ENCRYPTION_KEY = "dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw=="

describe("requireEnv", () => {
  const key = "WINDKEEP_TEST_REQUIRE_ENV"

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("returns the env value when set", () => {
    vi.stubEnv(key, "value")
    expect(requireEnv(key)).toBe("value")
  })

  it("throws when the env value is missing", () => {
    vi.stubEnv(key, "")
    expect(() => requireEnv(key)).toThrow(`Missing required environment variable: ${key}`)
  })
})

describe("hashToken", () => {
  beforeEach(() => {
    vi.stubEnv("ENCRYPTION_KEY", TEST_ENCRYPTION_KEY)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("returns a stable hex digest", () => {
    const first = hashToken("token-a")
    const second = hashToken("token-a")
    expect(first).toBe(second)
    expect(first).toMatch(/^[a-f0-9]{64}$/)
  })

  it("changes when the token changes", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"))
  })
})

describe("generateToken", () => {
  it("returns hex of the requested byte length", () => {
    expect(generateToken(12)).toMatch(/^[a-f0-9]{24}$/)
    expect(generateToken(16)).toMatch(/^[a-f0-9]{32}$/)
  })

  it("returns unique values", () => {
    expect(generateToken()).not.toBe(generateToken())
  })
})

describe("getInviteBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("trims trailing slashes", () => {
    vi.stubEnv("NUXT_PUBLIC_BASE_URL", "https://windkeep.example.com///")
    expect(getInviteBaseUrl({} as any)).toBe("https://windkeep.example.com")
  })
})

describe("getBinaryBlobUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("returns known binary urls", async () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://cdn.example.com")
    await expect(getBinaryBlobUrl("checksums.txt")).resolves.toBe("https://cdn.example.com/binaries/checksums.txt")
    await expect(getBinaryBlobUrl("windkeep-linux-amd64")).resolves.toContain("windkeep-linux-amd64")
    await expect(getBinaryBlobUrl("windkeep-windows-amd64.exe")).resolves.toContain("windows")
  })

  it("throws 404 for unknown binaries", async () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://cdn.example.com")
    await expect(getBinaryBlobUrl("missing.bin")).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe("getUserFromSession", () => {
  beforeEach(() => {
    resetNitroMocks()
    vi.stubEnv("ENCRYPTION_KEY", TEST_ENCRYPTION_KEY)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("returns the session user when present", async () => {
    getUserSession.mockResolvedValue({ user: { id: "u1", email: "a@b.c", name: "Ada", image: null } })
    await expect(getUserFromSession({} as any)).resolves.toEqual({ id: "u1", email: "a@b.c", name: "Ada", image: "" })
  })

  it("authenticates via a valid bearer api token", async () => {
    getUserSession.mockResolvedValue({})
    getHeader.mockReturnValue("Bearer raw-token")
    db.user.findFirst.mockResolvedValue({ id: "u2", email: "cli@b.c", name: "Cli", image: "img", apiTokenExpiresAt: new Date(Date.now() + 60_000) })

    await expect(getUserFromSession({} as any)).resolves.toEqual({ id: "u2", email: "cli@b.c", name: "Cli", image: "img" })
    expect(db.user.findFirst).toHaveBeenCalledWith({ where: { apiToken: hashToken("raw-token") }, select: { id: true, email: true, name: true, image: true, apiTokenExpiresAt: true } })

    db.user.findFirst.mockResolvedValue({ id: "u3", email: "cli2@b.c", name: "Cli2", image: null, apiTokenExpiresAt: new Date(Date.now() + 60_000) })
    await expect(getUserFromSession({} as any)).resolves.toMatchObject({ id: "u3", image: "" })
  })

  it("rejects expired or missing bearer tokens", async () => {
    getUserSession.mockResolvedValue({})
    getHeader.mockReturnValue("Bearer expired")
    db.user.findFirst.mockResolvedValue({ id: "u2", email: "cli@b.c", name: "Cli", image: "", apiTokenExpiresAt: new Date(Date.now() - 60_000) })
    await expect(getUserFromSession({} as any)).rejects.toMatchObject({ statusCode: 401 })

    getHeader.mockReturnValue("Bearer no-expiry")
    db.user.findFirst.mockResolvedValue({ id: "u2", email: "cli@b.c", name: "Cli", image: "", apiTokenExpiresAt: null })
    await expect(getUserFromSession({} as any)).rejects.toMatchObject({ statusCode: 401 })

    getHeader.mockReturnValue("Basic nope")
    await expect(getUserFromSession({} as any)).rejects.toMatchObject({ statusCode: 401 })

    getHeader.mockReturnValue(undefined)
    db.user.findFirst.mockResolvedValue(null)
    await expect(getUserFromSession({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })
})

describe("generateSlug", () => {
  beforeEach(() => {
    resetNitroMocks()
  })

  it("slugifies and returns the first available slug", async () => {
    db.project.findUnique.mockResolvedValue(null)
    await expect(generateSlug("  Café App!! ", "org-1")).resolves.toBe("cafe-app")
  })

  it("appends a suffix on collision and falls back after retries", async () => {
    db.project.findUnique.mockResolvedValueOnce({ id: "1" }).mockResolvedValueOnce(null)
    const slug = await generateSlug("demo", "org-1")
    expect(slug.startsWith("demo-")).toBe(true)

    db.project.findUnique.mockResolvedValue({ id: "taken" })
    const fallback = await generateSlug("---Name---", "org-1")
    expect(fallback).toMatch(/^[a-f0-9]{12}$/)
  })
})

describe("requireRole", () => {
  beforeEach(() => {
    resetNitroMocks()
  })

  it("rejects missing users", async () => {
    await expect(requireRole("", { type: "org", orgId: "o1" }, ["OWNER"])).rejects.toMatchObject({ statusCode: 401 })
  })

  it("checks org membership roles", async () => {
    db.orgMembership.findUnique.mockResolvedValue({ userId: "u1", orgId: "o1", role: "ADMIN" })
    await expect(requireRole("u1", { type: "org", orgId: "o1" }, ["ADMIN", "OWNER"])).resolves.toMatchObject({ role: "ADMIN" })

    db.orgMembership.findUnique.mockResolvedValue({ userId: "u1", orgId: "o1", role: "MEMBER" })
    await expect(requireRole("u1", { type: "org", orgId: "o1" }, ["ADMIN"])).rejects.toMatchObject({ statusCode: 403 })
  })

  it("handles project scope, missing projects, inactive org membership, and org owners", async () => {
    db.project.findUnique.mockResolvedValue(null)
    await expect(requireRole("u1", { type: "project", projectId: "p1" }, ["MEMBER"])).rejects.toMatchObject({ statusCode: 404 })

    db.project.findUnique.mockResolvedValue({ orgId: "o1" })
    db.orgMembership.findUnique.mockResolvedValue(null)
    await expect(requireRole("u1", { type: "project", projectId: "p1" }, ["MEMBER"])).rejects.toMatchObject({ statusCode: 403 })

    db.orgMembership.findUnique.mockResolvedValue({ userId: "u1", orgId: "o1", role: "MEMBER", isActive: false })
    await expect(requireRole("u1", { type: "project", projectId: "p1" }, ["MEMBER"])).rejects.toMatchObject({ statusCode: 403 })

    db.orgMembership.findUnique.mockResolvedValue({ userId: "u1", orgId: "o1", role: "OWNER", isActive: true })
    db.projectMembership.findUnique.mockResolvedValue(null)
    await expect(requireRole("u1", { type: "project", projectId: "p1" }, ["OWNER"])).resolves.toEqual({ userId: "u1", projectId: "p1", role: "OWNER" })

    db.projectMembership.findUnique.mockResolvedValue({ userId: "u1", projectId: "p1", role: "OWNER" })
    await expect(requireRole("u1", { type: "project", projectId: "p1" }, ["OWNER"])).resolves.toMatchObject({ role: "OWNER" })

    db.orgMembership.findUnique.mockResolvedValue({ userId: "u1", orgId: "o1", role: "MEMBER", isActive: true })
    db.projectMembership.findUnique.mockResolvedValue({ userId: "u1", projectId: "p1", role: "ADMIN" })
    await expect(requireRole("u1", { type: "project", projectId: "p1" }, ["ADMIN"])).resolves.toMatchObject({ role: "ADMIN" })

    db.projectMembership.findUnique.mockResolvedValue({ userId: "u1", projectId: "p1", role: "MEMBER" })
    await expect(requireRole("u1", { type: "project", projectId: "p1" }, ["ADMIN"])).rejects.toMatchObject({ statusCode: 403 })
  })
})

describe("invalidateOrgProjectCaches", () => {
  beforeEach(() => {
    resetNitroMocks()
  })

  it("no-ops when there are no users to invalidate", async () => {
    db.orgMembership.findMany.mockResolvedValue([])
    await invalidateOrgProjectCaches("o1")
    expect(deleteCached).not.toHaveBeenCalled()
  })

  it("deletes cache keys for owners and extra users", async () => {
    db.orgMembership.findMany.mockResolvedValue([{ userId: "owner-1" }])
    await invalidateOrgProjectCaches("o1", "extra-1", "")
    expect(deleteCached).toHaveBeenCalledWith("user:projects:owner-1:o1", "user:projects:extra-1:o1")
  })
})

describe("createAuditLog", () => {
  beforeEach(() => {
    resetNitroMocks()
  })

  it("persists audit metadata from the request event", async () => {
    await createAuditLog({
      userId: "u1",
      orgId: "o1",
      projectId: "p1",
      action: "SECRET_CREATE",
      resource: "secret",
      metadata: { key: "API_KEY" },
      event: {
        node: {
          req: {
            headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8", "user-agent": "vitest" },
            socket: { remoteAddress: "127.0.0.1" },
          },
        },
      } as any,
    })

    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "u1",
        orgId: "o1",
        projectId: "p1",
        action: "SECRET_CREATE",
        resource: "secret",
        metadata: JSON.stringify({ key: "API_KEY" }),
        ip: "1.2.3.4",
        ua: "vitest",
        description: "SECRET_CREATE performed on secret",
      }),
    })
  })

  it("falls back to socket address and default description", async () => {
    await createAuditLog({
      userId: "u1",
      action: "LOGIN",
      event: {
        node: {
          req: {
            headers: { "x-forwarded-for": ["9.9.9.9"] },
            socket: { remoteAddress: "10.0.0.1" },
          },
        },
      } as any,
    })

    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ip: "9.9.9.9",
        ua: "unknown",
        description: "LOGIN performed on resource",
        metadata: undefined,
      }),
    })
  })

  it("uses unknown when no event is provided", async () => {
    await createAuditLog({ userId: "u1", action: "PING", description: "custom" })
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ip: "unknown",
        ua: "unknown",
        description: "custom",
      }),
    })
  })
})
