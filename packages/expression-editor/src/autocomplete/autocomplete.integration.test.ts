import { CompletionContext } from "@codemirror/autocomplete"
import { EditorState } from "@codemirror/state"
import { describe, expect, it } from "vitest"

import type { ExpressionVariableOption } from "../types"
import { createExpressionCompletionSource } from "./autocomplete"

describe("expression completion source integration", () => {
  it("resolves matching variable completions from typed prefix", () => {
    const variables: ExpressionVariableOption[] = [
      {
        value: '$node("trigger-a").item.json.eventName',
        label: '$node("trigger-a").item.json.eventName',
        description: "Trigger event",
        group: "Upstream: TriggerA",
      },
    ]
    const source = createExpressionCompletionSource(variables)
    const state = EditorState.create({
      doc: '$node("trigger-a").item',
    })
    const context = new CompletionContext(state, state.doc.length, true)
    const result = source(context)

    expect(result).not.toBeNull()
    expect(result?.options.some((option) => option.label.includes('$node("trigger-a")'))).toBe(
      true
    )
  })

  it("returns no builtin input completion when catalog is empty", () => {
    const source = createExpressionCompletionSource([])
    const state = EditorState.create({
      doc: "",
    })
    const context = new CompletionContext(state, 0, true)
    const result = source(context)

    if (result !== null) {
      expect(result.options.some((option) => option.label === "$input.item.json")).toBe(false)
    }
  })
})
