import { describe, expect, it } from "vitest"
import { createWrappedOrganizationKey, decryptWithKey, encryptWithKey, parseEncryptedData } from "../../server/utils/encryption"

const KEY = new Uint8Array(32).fill(7)

describe("parseEncryptedData", () => {
  it("parses a valid v1 payload", () => {
    const encrypted = encryptWithKey("hello", KEY)
    const parsed = parseEncryptedData(encrypted)
    expect(parsed.iv).toBeInstanceOf(Uint8Array)
    expect(parsed.authTag).toBeInstanceOf(Uint8Array)
    expect(parsed.encrypted).toBeInstanceOf(Uint8Array)
  })

  it("rejects invalid payloads", () => {
    expect(() => parseEncryptedData("not-valid")).toThrow("Invalid encrypted input format")
    expect(() => parseEncryptedData("v2:aa:bb:cc")).toThrow("Invalid encrypted input format")
  })
})

describe("encryptWithKey / decryptWithKey", () => {
  it("round-trips plaintext", () => {
    const encrypted = encryptWithKey("super-secret", KEY)
    expect(encrypted.startsWith("v1:")).toBe(true)
    expect(decryptWithKey(encrypted, KEY)).toBe("super-secret")
  })

  it("fails with the wrong key", () => {
    const encrypted = encryptWithKey("super-secret", KEY)
    expect(() => decryptWithKey(encrypted, new Uint8Array(32).fill(9))).toThrow()
  })
})

describe("createWrappedOrganizationKey", () => {
  it("returns a v1 wrapped key for auto mode", () => {
    expect(createWrappedOrganizationKey().startsWith("v1:")).toBe(true)
  })

  it("returns a v1 wrapped key for manual mode", () => {
    expect(createWrappedOrganizationKey("manual-password-long").startsWith("v1:")).toBe(true)
  })
})
