import { describe, expect, it } from "vitest"
import { buildEnvPreview, buildEnvText, buildSecretChangesFromEnv, formatEnvText, getEnvValues, mergeEnvText, mergeSecretValues, parseEnv, useEnvEditor } from "../../app/composables/use-env-editor"

function secret(key: string, values: { environment: Environment, value: string }[]): Secret {
  return { key, values } as Secret
}

describe("parseEnv", () => {
  it("parses keys, skips blanks/comments, strips quotes, and normalizes keys", () => {
    expect(parseEnv(`
# comment
API_KEY=secret
  api-key-2 = "quoted"
invalid-line
EMPTY=
`)).toEqual({
      API_KEY: "secret",
      API_KEY_2: "quoted",
      EMPTY: "",
    })
  })
})

describe("formatEnvText / mergeEnvText", () => {
  it("formats values as KEY=value lines", () => {
    expect(formatEnvText({ A: "1", B: "2" })).toBe("A=1\nB=2")
  })

  it("merges incoming keys over existing text", () => {
    expect(mergeEnvText("A=1\nB=2", "B=9\nC=3")).toBe("A=1\nB=9\nC=3")
  })
})

describe("getEnvValues / buildEnvText", () => {
  const secrets = [
    secret("API_KEY", [
      { environment: "DEVELOPMENT", value: "dev" },
      { environment: "PRODUCTION", value: "prod" },
    ]),
    secret("UNUSED", [{ environment: "STAGING", value: "stg" }]),
  ]

  it("picks values for the selected environment", () => {
    expect(getEnvValues(secrets, "DEVELOPMENT")).toEqual({ API_KEY: "dev" })
    expect(getEnvValues(secrets, "PRODUCTION")).toEqual({ API_KEY: "prod" })
  })

  it("builds env text for an environment", () => {
    expect(buildEnvText(secrets, "DEVELOPMENT")).toBe("API_KEY=dev")
  })
})

describe("mergeSecretValues", () => {
  it("updates matching environments and appends new ones", () => {
    const merged = mergeSecretValues(
      [{ environment: "DEVELOPMENT", value: "old" } as SecretValue],
      [
        { environment: "DEVELOPMENT", value: "new" } as SecretValue,
        { environment: "PRODUCTION", value: "prod" } as SecretValue,
      ],
    )

    expect(merged).toEqual([
      { environment: "DEVELOPMENT", value: "new" },
      { environment: "PRODUCTION", value: "prod" },
    ])
  })
})

describe("buildEnvPreview", () => {
  it("classifies added, updated, and removed keys", () => {
    const items = buildEnvPreview({ A: "1", B: "2", C: "3" }, { A: "1", B: "9", D: "4" })
    expect(items.map(i => [i.key, i.type])).toEqual([
      ["B", "updated"],
      ["D", "added"],
      ["C", "removed"],
    ])
  })

  it("skips empty next values", () => {
    expect(buildEnvPreview({}, { A: "" })).toEqual([])
  })
})

describe("buildSecretChangesFromEnv", () => {
  const secrets = [
    secret("KEEP", [{ environment: "DEVELOPMENT", value: "same" }]),
    secret("UPDATE", [{ environment: "DEVELOPMENT", value: "old" }]),
    secret("REMOVE", [{ environment: "DEVELOPMENT", value: "gone" }]),
  ]

  it("returns upserts and removals for the selected env", () => {
    const { upserted, removed } = buildSecretChangesFromEnv(
      "project-1",
      secrets,
      "DEVELOPMENT",
      { KEEP: "same", UPDATE: "new", ADD: "fresh" },
    )

    expect(removed).toEqual([{ key: "REMOVE", environment: "DEVELOPMENT" }])
    expect(upserted.map(s => s.key).sort()).toEqual(["ADD", "UPDATE"])
    expect(upserted.find(s => s.key === "ADD")).toMatchObject({
      projectId: "project-1",
      values: [{ environment: "DEVELOPMENT", value: "fresh" }],
    })
  })
})

describe("useEnvEditor", () => {
  it("selects environments, previews diffs, and reports changes", () => {
    const secrets = ref([
      secret("API_KEY", [{ environment: "DEVELOPMENT", value: "dev" }]),
    ])
    const editor = useEnvEditor({ secrets, projectId: "project-1" })

    editor.resetEditor()
    expect(editor.selectedEnv.value).toBe("DEVELOPMENT")
    expect(editor.editorContent.value).toBe("API_KEY=dev")

    editor.editorContent.value = "API_KEY=changed\nNEW_KEY=1"
    expect(editor.hasPreview.value).toBe(true)
    expect(editor.previewItems.value.map(i => i.type).sort()).toEqual(["added", "updated"])

    const changes = editor.getChanges()
    expect(changes.upserted.map(s => s.key).sort()).toEqual(["API_KEY", "NEW_KEY"])
    expect(changes.removed).toEqual([])
  })
})
