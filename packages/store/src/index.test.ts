import { create as zustandCreate } from "zustand"
import { describe, expect, it } from "vitest"

import {
  create,
  createContextStore,
  createHistoryState,
  pushHistoryState,
  redoHistoryState,
  undoHistoryState,
} from "./index"

describe("store history helpers", () => {
  it("creates initial history state", () => {
    const history = createHistoryState({ value: 1 })

    expect(history).toEqual({
      past: [],
      present: { value: 1 },
      future: [],
    })
  })

  it("pushes next value and clears future", () => {
    const initial = createHistoryState("a")
    const pushed = pushHistoryState(initial, "b")
    const undone = undoHistoryState(pushed)
    const next = pushHistoryState(undone, "c")

    expect(next).toEqual({
      past: ["a"],
      present: "c",
      future: [],
    })
  })

  it("respects history limit and normalizes invalid limits to 1", () => {
    let history = createHistoryState(0)

    for (let index = 1; index <= 5; index += 1) {
      history = pushHistoryState(history, index, 3)
    }

    expect(history.past).toEqual([2, 3, 4])
    expect(history.present).toBe(5)

    const normalized = pushHistoryState(createHistoryState(1), 2, 0)
    expect(normalized.past).toEqual([1])
  })

  it("undo returns the same object when there is no past", () => {
    const history = createHistoryState(10)
    const result = undoHistoryState(history)

    expect(result).toBe(history)
  })

  it("undo returns the same object when previous value is undefined", () => {
    const history = {
      past: [undefined] as Array<number | undefined>,
      present: 7,
      future: [] as number[],
    }

    const result = undoHistoryState(history)
    expect(result).toBe(history)
  })

  it("undo moves present value to future and restores previous value", () => {
    const initial = createHistoryState("start")
    const withMiddle = pushHistoryState(initial, "middle")
    const withEnd = pushHistoryState(withMiddle, "end")

    const result = undoHistoryState(withEnd)

    expect(result).toEqual({
      past: ["start"],
      present: "middle",
      future: ["end"],
    })
  })

  it("redo returns the same object when there is no future", () => {
    const history = createHistoryState("only")
    const result = redoHistoryState(history)

    expect(result).toBe(history)
  })

  it("redo returns the same object when next value is undefined", () => {
    const history = {
      past: ["first"],
      present: "second",
      future: [undefined] as Array<string | undefined>,
    }

    const result = redoHistoryState(history)
    expect(result).toBe(history)
  })

  it("redo restores next value and appends current to past", () => {
    const history = {
      past: ["a"],
      present: "b",
      future: ["c", "d"],
    }

    const result = redoHistoryState(history)

    expect(result).toEqual({
      past: ["a", "b"],
      present: "c",
      future: ["d"],
    })
  })
})

describe("store exports", () => {
  it("re-exports zustand create", () => {
    expect(create).toBe(zustandCreate)
  })

  it("exports createContextStore", () => {
    expect(createContextStore).toBeTypeOf("function")
  })
})
