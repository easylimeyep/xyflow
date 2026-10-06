"use client"

import { Button } from "@flow/ui/components/button"
import { Fragment, type SyntheticEvent } from "react"

import { selectionToolbarStyles } from "../../../styles/components/canvas"
import { ActionTooltip } from "../action-tooltip"
import {
  getAvailableCommands,
  getCommandPresentation,
  startsDestructiveGroup,
  useSelectionCommandActions,
  useSelectionSummary,
} from "../../selection-commands"

// React Flow's own pan/drag listeners are native, so the `nodrag nopan`
// classes on the root are what keep a press here from moving the canvas.
// These handlers only stop the press from bubbling through the React tree to
// the canvas wrappers that own the toolbar (it is portaled, but React events
// still follow the component tree); react-aria buttons already do this for
// presses on the buttons themselves.
function stopCanvasPropagation(event: SyntheticEvent) {
  event.stopPropagation()
}

export interface SelectionToolbarProps {
  /**
   * Runs after any command. The canvas uses it to take focus back: Delete
   * unmounts the toolbar together with the focused button, which would drop
   * focus to the body, or to the first field of a focus-trapping dialog.
   */
  onAfterCommand?: () => void
}

/**
 * Icon buttons for the commands that apply to the current selection of nodes
 * and groups.
 */
export function SelectionToolbar({ onAfterCommand }: SelectionToolbarProps) {
  const actions = useSelectionCommandActions()
  const selection = useSelectionSummary()
  const commands = getAvailableCommands(selection)
  const styles = selectionToolbarStyles()

  return (
    // The handlers only stop presses from reaching the canvas; the actions are buttons.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      role="group"
      aria-label="Selection actions"
      className={styles.root()}
      data-testid="selection-toolbar"
      onPointerDown={stopCanvasPropagation}
      onMouseDown={stopCanvasPropagation}
      onClick={stopCanvasPropagation}
      onDoubleClick={stopCanvasPropagation}
    >
      {commands.map((command, index) => {
        const { label, icon: Icon } = getCommandPresentation(command, selection)

        return (
          <Fragment key={command.id}>
            {startsDestructiveGroup(commands, index) ? (
              <span className={styles.separator()} aria-hidden="true" />
            ) : null}
            <ActionTooltip
              label={label}
              shortcut={command.shortcut ? [command.shortcut] : undefined}
            >
              <Button
                size="icon-sm"
                variant={command.destructive ? "destructive" : "ghost"}
                className={styles.button({
                  destructive: command.destructive,
                })}
                aria-label={label}
                onPress={() => {
                  command.run(actions, selection)
                  onAfterCommand?.()
                }}
              >
                <Icon />
              </Button>
            </ActionTooltip>
          </Fragment>
        )
      })}
    </div>
  )
}
