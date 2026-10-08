import { afterEach, describe, expect, it, vi } from "vitest"
import { generateToken, getInviteBaseUrl, hashToken, requireEnv } from "../../server/utils/helpers"

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
