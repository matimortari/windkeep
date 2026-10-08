import { describe, expect, it } from "vitest"
import { formatDate, getErrorMessage, normalizeKey, slugify } from "../../app/utils/helpers"

describe("formatDate", () => {
  it("returns a placeholder for empty input", () => {
    expect(formatDate(null)).toBe("-")
    expect(formatDate(undefined)).toBe("-")
  })
})

describe("normalizeKey", () => {
  it("uppercases and strips invalid chars", () => {
    expect(normalizeKey("  api-key  ")).toBe("API_KEY")
  })

  it("collapses consecutive underscores", () => {
    expect(normalizeKey("foo__bar")).toBe("FOO_BAR")
  })
})

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  it("trims surrounding whitespace", () => {
    expect(slugify("  Foo Bar  ")).toBe("foo-bar")
  })
})

describe("getErrorMessage", () => {
  it("returns fallback for non-objects", () => {
    expect(getErrorMessage(null, "fallback")).toBe("fallback")
    expect(getErrorMessage("oops", "fallback")).toBe("fallback")
  })

  it("joins Zod-style issues", () => {
    expect(getErrorMessage({ data: { issues: [{ message: "a" }, { message: "b" }] } }, "fallback")).toBe("a, b")
  })

  it("prefers statusText then message", () => {
    expect(getErrorMessage({ data: { statusText: "denied" } }, "fallback")).toBe("denied")
    expect(getErrorMessage({ message: "boom" }, "fallback")).toBe("boom")
  })
})
