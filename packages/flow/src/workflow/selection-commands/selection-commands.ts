import { Copy, CopyPlus, Trash2, type LucideIcon } from "lucide-react"

import { useWorkflowShallowStore, type WorkflowStoreState } from "../store"

export type SelectionCommandId = "copy" | "duplicate" | "delete"

/** The store actions a selection command can call. */
export type SelectionCommandActions = Pick<
  WorkflowStoreState,
  "copySelectionToClipboard" | "duplicateNodes" | "deleteNodes"
>

/**
 * One command that acts on the current node selection. The node context menu
 * and the selection toolbar both render from this list, so their labels,
 * hints and order cannot drift apart.
 */
export interface SelectionCommand {
  readonly id: SelectionCommandId
  readonly label: string
  readonly icon: LucideIcon
  /** Keyboard hint shown next to the command, e.g. `Ctrl+C`. */
  readonly shortcut: string
  /** Destructive commands render after a separator, in red. */
  readonly destructive: boolean
  readonly run: (actions: SelectionCommandActions) => void
}

export const SELECTION_COMMANDS: readonly SelectionCommand[] = Object.freeze([
  Object.freeze<SelectionCommand>({
    id: "copy",
    label: "Copy",
    icon: Copy,
    shortcut: "Ctrl+C",
    destructive: false,
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
    run: (actions) => {
      actions.duplicateNodes()
    },
  }),
  Object.freeze<SelectionCommand>({
    id: "delete",
    label: "Delete",
    icon: Trash2,
    shortcut: "Del / Backspace",
    destructive: true,
    run: (actions) => {
      actions.deleteNodes()
    },
  }),
])

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

function selectSelectionCommandActions(
  state: WorkflowStoreState
): SelectionCommandActions {
  return {
    copySelectionToClipboard: state.copySelectionToClipboard,
    duplicateNodes: state.duplicateNodes,
    deleteNodes: state.deleteNodes,
  }
}

/** The store actions the selection commands run against. */
export function useSelectionCommandActions(): SelectionCommandActions {
  return useWorkflowShallowStore(selectSelectionCommandActions)
}
