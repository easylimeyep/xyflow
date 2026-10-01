import { describe, expect, it, vi } from "vitest"

import {
  SELECTION_COMMANDS,
  startsDestructiveGroup,
  type SelectionCommand,
  type SelectionCommandActions,
} from "./selection-commands"

function createActions(): SelectionCommandActions {
  return {
    copySelectionToClipboard: vi.fn(async () => true),
    duplicateNodes: vi.fn(() => true),
    deleteNodes: vi.fn(() => true),
  }
}

describe("SELECTION_COMMANDS", () => {
  it("lists copy, duplicate and delete in menu order with their hints", () => {
    expect(
      SELECTION_COMMANDS.map(({ id, label, shortcut, destructive }) => ({
        id,
        label,
        shortcut,
        destructive,
      }))
    ).toEqual([
      { id: "copy", label: "Copy", shortcut: "Ctrl+C", destructive: false },
      {
        id: "duplicate",
        label: "Duplicate",
        shortcut: "Ctrl+D",
        destructive: false,
      },
      {
        id: "delete",
        label: "Delete",
        shortcut: "Del / Backspace",
        destructive: true,
      },
    ])
  })

  it("is frozen so consumers cannot reorder or replace commands", () => {
    expect(Object.isFrozen(SELECTION_COMMANDS)).toBe(true)
    for (const command of SELECTION_COMMANDS) {
      expect(Object.isFrozen(command)).toBe(true)
    }
  })

  it.each([
    ["copy", "copySelectionToClipboard"],
    ["duplicate", "duplicateNodes"],
    ["delete", "deleteNodes"],
  ] as const)("runs %s through the %s store action", (id, actionName) => {
    const actions = createActions()
    const command = SELECTION_COMMANDS.find((entry) => entry.id === id)

    command?.run(actions)

    expect(actions[actionName]).toHaveBeenCalledTimes(1)
    expect(actions[actionName]).toHaveBeenCalledWith()
    for (const [name, action] of Object.entries(actions)) {
      if (name !== actionName) {
        expect(action).not.toHaveBeenCalled()
      }
    }
  })
})

describe("startsDestructiveGroup", () => {
  it("is true only for the first destructive command after a safe one", () => {
    expect(
      SELECTION_COMMANDS.map((_, index) =>
        startsDestructiveGroup(SELECTION_COMMANDS, index)
      )
    ).toEqual([false, false, true])
  })

  it("does not start a group at the head of the list", () => {
    const onlyDestructive: readonly SelectionCommand[] =
      SELECTION_COMMANDS.filter((command) => command.destructive)

    expect(startsDestructiveGroup(onlyDestructive, 0)).toBe(false)
  })
})
