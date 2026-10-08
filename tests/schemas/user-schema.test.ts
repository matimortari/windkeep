import { describe, expect, it } from "vitest"
import { updateUserSchema } from "../../shared/schemas/user-schema"

describe("updateUserSchema", () => {
  it("accepts a valid name", () => {
    expect(updateUserSchema.parse({ name: "  Ada  " })).toEqual({ name: "Ada" })
  })

  it("rejects names that are too short", () => {
    expect(updateUserSchema.safeParse({ name: "ab" }).success).toBe(false)
  })

  it("allows an empty object", () => {
    expect(updateUserSchema.parse({})).toEqual({})
  })
})
