import { describe, expect, it, vi } from "vitest"

import {
  getAvailableCommands,
  getCommandPresentation,
  SELECTION_COMMANDS,
  startsDestructiveGroup,
  type SelectionCommand,
  type SelectionCommandActions,
  type SelectionSummary,
} from "./selection-commands"

function createActions(): SelectionCommandActions {
  return {
    copySelectionToClipboard: vi.fn(async () => true),
    duplicateNodes: vi.fn(() => true),
    deleteSelection: vi.fn(() => true),
    groupNodes: vi.fn(() => "group-1"),
    ungroup: vi.fn(() => true),
    setGroupCollapsed: vi.fn(),
  }
}

function summary(overrides: Partial<SelectionSummary> = {}): SelectionSummary {
  return {
    nodeIds: [],
    groupIds: [],
    hasGroupedNode: false,
    soleGroupCollapsed: null,
    ...overrides,
  }
}

function availableIds(selection: SelectionSummary) {
  return getAvailableCommands(selection).map((command) => command.id)
}

describe("SELECTION_COMMANDS", () => {
  it("lists every command in menu order with its hint", () => {
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
      { id: "group", label: "Group", shortcut: "Ctrl+G", destructive: false },
      {
        id: "toggle-collapse",
        label: "Collapse",
        shortcut: "",
        destructive: false,
      },
      {
        id: "ungroup",
        label: "Ungroup",
        shortcut: "Ctrl+Shift+G",
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
    ["group", "groupNodes"],
    ["ungroup", "ungroup"],
    ["delete", "deleteSelection"],
  ] as const)("runs %s through the %s store action", (id, actionName) => {
    const actions = createActions()
    const command = SELECTION_COMMANDS.find((entry) => entry.id === id)

    command?.run(actions, summary())

    expect(actions[actionName]).toHaveBeenCalledTimes(1)
    expect(actions[actionName]).toHaveBeenCalledWith()
    for (const [name, action] of Object.entries(actions)) {
      if (name !== actionName) {
        expect(action).not.toHaveBeenCalled()
      }
    }
  })

  it("toggles the sole selected group's collapsed state", () => {
    const actions = createActions()
    const command = SELECTION_COMMANDS.find((c) => c.id === "toggle-collapse")

    command?.run(
      actions,
      summary({ groupIds: ["g"], soleGroupCollapsed: false })
    )
    command?.run(
      actions,
      summary({ groupIds: ["g"], soleGroupCollapsed: true })
    )

    expect(actions.setGroupCollapsed).toHaveBeenNthCalledWith(1, "g", true)
    expect(actions.setGroupCollapsed).toHaveBeenNthCalledWith(2, "g", false)
  })
})

describe("command availability", () => {
  it("offers Group for ungrouped nodes, including a single one", () => {
    expect(availableIds(summary({ nodeIds: ["a", "b"] }))).toEqual([
      "copy",
      "duplicate",
      "group",
      "delete",
    ])
    expect(availableIds(summary({ nodeIds: ["a"] }))).toContain("group")
  })

  it("offers neither Group nor Ungroup when a selected node is grouped", () => {
    expect(
      availableIds(summary({ nodeIds: ["a", "b"], hasGroupedNode: true }))
    ).toEqual(["copy", "duplicate", "delete"])
  })

  it("offers the group commands for exactly one selected group", () => {
    expect(
      availableIds(summary({ groupIds: ["g"], soleGroupCollapsed: false }))
    ).toEqual(["copy", "duplicate", "toggle-collapse", "ungroup", "delete"])
  })

  it.each([
    ["groups and nodes", summary({ groupIds: ["g"], nodeIds: ["a"] })],
    ["several groups", summary({ groupIds: ["g", "h"] })],
  ])("offers only Copy, Duplicate and Delete for %s", (_name, selection) => {
    expect(availableIds(selection)).toEqual(["copy", "duplicate", "delete"])
  })

  it("offers nothing for an empty selection", () => {
    expect(availableIds(summary())).toEqual([])
  })

  it("names the toggle Expand for a collapsed group", () => {
    const toggle = SELECTION_COMMANDS.find((c) => c.id === "toggle-collapse")!
    expect(
      getCommandPresentation(
        toggle,
        summary({ groupIds: ["g"], soleGroupCollapsed: true })
      ).label
    ).toBe("Expand")
    expect(
      getCommandPresentation(
        toggle,
        summary({ groupIds: ["g"], soleGroupCollapsed: false })
      ).label
    ).toBe("Collapse")
  })
})

describe("startsDestructiveGroup", () => {
  it("is true only for the first destructive command after a safe one", () => {
    expect(
      SELECTION_COMMANDS.map((_, index) =>
        startsDestructiveGroup(SELECTION_COMMANDS, index)
      )
    ).toEqual([false, false, false, false, false, true])
  })

  it("does not start a group at the head of the list", () => {
    const onlyDestructive: readonly SelectionCommand[] =
      SELECTION_COMMANDS.filter((command) => command.destructive)

    expect(startsDestructiveGroup(onlyDestructive, 0)).toBe(false)
  })
})
