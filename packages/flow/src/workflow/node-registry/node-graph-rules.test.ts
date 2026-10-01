import { describe, expect, it } from "vitest"

import { builtinBaseDefinitions } from "./builtin-base-definitions"
import { allowsMultipleBranchTargets } from "./node-graph-rules"
import { createNodeRegistry } from "./registry"

describe("allowsMultipleBranchTargets", () => {
  const registry = createNodeRegistry(builtinBaseDefinitions)

  it("lets the jsonEvaluator fan a branch out and keeps the evaluator single", () => {
    expect(allowsMultipleBranchTargets(registry, "jsonEvaluator")).toBe(true)
    expect(allowsMultipleBranchTargets(registry, "evaluator")).toBe(false)
  })

  it("answers false for a kind the registry does not hold", () => {
    expect(
      allowsMultipleBranchTargets(createNodeRegistry([]), "jsonEvaluator")
    ).toBe(false)
  })

  it("ignores the flag on a kind without branch handles", () => {
    const flagged = createNodeRegistry(
      builtinBaseDefinitions.map((definition) =>
        definition.kind === "setVariable"
          ? { ...definition, multipleBranchTargets: true }
          : definition
      )
    )

    expect(allowsMultipleBranchTargets(flagged, "setVariable")).toBe(false)
  })
})
