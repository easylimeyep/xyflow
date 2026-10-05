import {
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  CopyPlus,
  Group,
  Trash2,
  Ungroup,
  type LucideIcon,
} from "lucide-react"

import { useWorkflowShallowStore, type WorkflowStoreState } from "../store"

export type SelectionCommandId =
  | "copy"
  | "duplicate"
  | "group"
  | "toggle-collapse"
  | "ungroup"
  | "delete"

/** The store actions a selection command can call. */
export type SelectionCommandActions = Pick<
  WorkflowStoreState,
  | "copySelectionToClipboard"
  | "duplicateNodes"
  | "deleteSelection"
  | "groupNodes"
  | "ungroup"
  | "setGroupCollapsed"
>

/**
 * What is selected, as far as the commands care: which nodes, which groups,
 * whether any selected node already belongs to a group, and — for a lone
 * selected group — whether it is collapsed.
 */
export interface SelectionSummary {
  nodeIds: readonly string[]
  groupIds: readonly string[]
  hasGroupedNode: boolean
  /** Collapsed state of the only selected group; `null` otherwise. */
  soleGroupCollapsed: boolean | null
}

/**
 * One command that acts on the current selection. The node context menu, the
 * group context menu, and the selection toolbar all render from this list,
 * so their labels, hints, order, and availability cannot drift apart.
 */
export interface SelectionCommand {
  readonly id: SelectionCommandId
  readonly label: string
  readonly icon: LucideIcon
  /** Keyboard hint shown next to the command, e.g. `Ctrl+C`. */
  readonly shortcut: string
  /** Destructive commands render after a separator, in red. */
  readonly destructive: boolean
  readonly isAvailable: (selection: SelectionSummary) => boolean
  readonly run: (
    actions: SelectionCommandActions,
    selection: SelectionSummary
  ) => void
}

function hasAnything(selection: SelectionSummary): boolean {
  return selection.nodeIds.length > 0 || selection.groupIds.length > 0
}

function isSoleGroup(selection: SelectionSummary): boolean {
  return selection.groupIds.length === 1 && selection.nodeIds.length === 0
}

export const SELECTION_COMMANDS: readonly SelectionCommand[] = Object.freeze([
  Object.freeze<SelectionCommand>({
    id: "copy",
    label: "Copy",
    icon: Copy,
    shortcut: "Ctrl+C",
    destructive: false,
    isAvailable: hasAnything,
    run: (actions) => {
      void actions.copySelectionToClipboard()
    },
  }),
  Object.freeze<SelectionCommand>({
    id: "duplicate",
    label: "Duplicate",
    icon: CopyPlus,
    shortcut: "Ctrl+D",
    destructive: false,
    isAvailable: hasAnything,
    run: (actions) => {
      actions.duplicateNodes()
    },
  }),
  Object.freeze<SelectionCommand>({
    id: "group",
    label: "Group",
    icon: Group,
    shortcut: "Ctrl+G",
    destructive: false,
    isAvailable: (selection) =>
      selection.groupIds.length === 0 &&
      selection.nodeIds.length > 0 &&
      !selection.hasGroupedNode,
    run: (actions) => {
      actions.groupNodes()
    },
  }),
  Object.freeze<SelectionCommand>({
    id: "toggle-collapse",
    label: "Collapse",
    icon: ChevronsDownUp,
    shortcut: "",
    destructive: false,
    isAvailable: isSoleGroup,
    run: (actions, selection) => {
      const groupId = selection.groupIds[0]
      if (groupId !== undefined) {
        actions.setGroupCollapsed(groupId, !selection.soleGroupCollapsed)
      }
    },
  }),
  Object.freeze<SelectionCommand>({
    id: "ungroup",
    label: "Ungroup",
    icon: Ungroup,
    shortcut: "Ctrl+Shift+G",
    destructive: false,
    isAvailable: isSoleGroup,
    run: (actions) => {
      actions.ungroup()
    },
  }),
  Object.freeze<SelectionCommand>({
    id: "delete",
    label: "Delete",
    icon: Trash2,
    shortcut: "Del / Backspace",
    destructive: true,
    isAvailable: hasAnything,
    run: (actions) => {
      actions.deleteSelection()
    },
  }),
])

/**
 * How a command presents for this selection. Only the collapse toggle varies:
 * it reads "Expand" for a collapsed group.
 */
export function getCommandPresentation(
  command: SelectionCommand,
  selection: SelectionSummary
): { label: string; icon: LucideIcon } {
  if (command.id === "toggle-collapse" && selection.soleGroupCollapsed) {
    return { label: "Expand", icon: ChevronsUpDown }
  }
  return { label: command.label, icon: command.icon }
}

/** The commands that apply to the selection, in menu order. */
export function getAvailableCommands(
  selection: SelectionSummary
): SelectionCommand[] {
  return SELECTION_COMMANDS.filter((command) => command.isAvailable(selection))
}

/**
 * Whether a separator belongs before the command at `index`: true for the
 * first destructive command that follows a non-destructive one.
 */
export function startsDestructiveGroup(
  commands: readonly SelectionCommand[],
  index: number
): boolean {
  const command = commands[index]
  const previous = commands[index - 1]
  return Boolean(command?.destructive && previous && !previous.destructive)
}

/** Summarizes the store's current selection for the commands. */
export function selectSelectionSummary(
  state: WorkflowStoreState
): SelectionSummary {
  const { selectedNodeIds, selectedGroupIds, graph } = state
  const selectedNodeIdSet = new Set(selectedNodeIds)
  const hasGroupedNode =
    selectedNodeIds.length > 0 &&
    graph.nodes.some(
      (node) =>
        selectedNodeIdSet.has(node.id) && node.data.groupId !== undefined
    )
  const soleGroup =
    selectedGroupIds.length === 1
      ? graph.groups.find((group) => group.id === selectedGroupIds[0])
      : undefined

  return {
    nodeIds: selectedNodeIds,
    groupIds: selectedGroupIds,
    hasGroupedNode,
    soleGroupCollapsed: soleGroup ? soleGroup.collapsed : null,
  }
}

function selectSelectionCommandActions(
  state: WorkflowStoreState
): SelectionCommandActions {
  return {
    copySelectionToClipboard: state.copySelectionToClipboard,
    duplicateNodes: state.duplicateNodes,
    deleteSelection: state.deleteSelection,
    groupNodes: state.groupNodes,
    ungroup: state.ungroup,
    setGroupCollapsed: state.setGroupCollapsed,
  }
}

/** The store actions the selection commands run against. */
export function useSelectionCommandActions(): SelectionCommandActions {
  return useWorkflowShallowStore(selectSelectionCommandActions)
}

/** The current selection summary; re-renders only when it changes. */
export function useSelectionSummary(): SelectionSummary {
  return useWorkflowShallowStore(selectSelectionSummary)
}
