import { describe, expect, it } from "vitest"
import {
  createHistoryState,
  pushHistoryState,
  redoHistoryState,
  undoHistoryState,
} from "@workspace/store"

describe("history state helpers", () => {
  it("pushes next state and clears future", () => {
    const initial = createHistoryState(1)
    const withSecond = pushHistoryState(initial, 2)
    const withFuture = undoHistoryState(withSecond)
    const withThird = pushHistoryState(withFuture, 3)

    expect(withThird.present).toBe(3)
    expect(withThird.future).toHaveLength(0)
    expect(withThird.past).toContain(1)
  })

  it("undo and redo state transitions", () => {
    const initial = createHistoryState("a")
    const state1 = pushHistoryState(initial, "b")
    const state2 = pushHistoryState(state1, "c")
    const undoState = undoHistoryState(state2)
    const redoState = redoHistoryState(undoState)

    expect(undoState.present).toBe("b")
    expect(redoState.present).toBe("c")
  })

  it("respects history limit", () => {
    let history = createHistoryState(0)
    for (let index = 1; index <= 5; index += 1) {
      history = pushHistoryState(history, index, 3)
    }

    expect(history.past).toHaveLength(3)
    expect(history.past[0]).toBe(2)
    expect(history.present).toBe(5)
  })
})
