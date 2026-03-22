import { CompletionContext } from "@codemirror/autocomplete"
import { EditorState } from "@codemirror/state"
import { describe, expect, it } from "vitest"

import type { ExpressionVariableOption } from "../types"
import { createExpressionCompletionSource } from "./autocomplete"

describe("expression completion source integration", () => {
  it("resolves matching variable completions from typed prefix", () => {
    const variables: ExpressionVariableOption[] = [
      {
        value: '$("TriggerA").item.json.eventName',
        label: '$("TriggerA").item.json.eventName',
        description: "Trigger event",
        group: "Upstream: TriggerA",
      },
    ]
    const source = createExpressionCompletionSource(variables)
    const state = EditorState.create({
      doc: '$("TriggerA").item',
    })
    const context = new CompletionContext(state, state.doc.length, true)
    const result = source(context)

    expect(result).not.toBeNull()
    expect(result?.options.some((option) => option.label.includes("TriggerA"))).toBe(true)
  })

  it("includes builtins when explicit completion is requested", () => {
    const source = createExpressionCompletionSource([])
    const state = EditorState.create({
      doc: "",
    })
    const context = new CompletionContext(state, 0, true)
    const result = source(context)

    expect(result).not.toBeNull()
    expect(result?.options.some((option) => option.label === "$input.item.json")).toBe(true)
  })
})
