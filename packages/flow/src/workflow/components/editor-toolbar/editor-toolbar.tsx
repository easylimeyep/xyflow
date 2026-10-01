"use client"

import { type Ref, useState } from "react"

import { Button } from "@flow/ui/components/button"
import { Toggle } from "@flow/ui/components/toggle"
import { CopyIcon, Redo2Icon, SearchIcon, Undo2Icon } from "lucide-react"

import { editorToolbarStyles } from "../../../styles/components/editor-shell"
import { ActionTooltip } from "../action-tooltip"

const UNDO_SHORTCUT = ["Ctrl+Z"]
const REDO_SHORTCUT = ["Ctrl+Shift+Z"]
const SEARCH_SHORTCUT = ["Ctrl+F"]

export interface EditorToolbarSearch {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export interface EditorToolbarProps {
  anchorRef?: Ref<HTMLDivElement>
  /**
   * `floating` (default) pins the bar over the middle of the top edge of its
   * positioned container; `inline` renders it in flow.
   */
  placement?: "floating" | "inline"
  /** Hides undo/redo, e.g. while the editor is read-only. */
  showHistory?: boolean
  canUndo: boolean
  canRedo: boolean
  lastError: string | null
  onUndo: () => void
  onRedo: () => void
  onClearError: () => void
  /** False while the graph is empty, which leaves nothing to copy. */
  canCopyAll: boolean
  /**
   * Copies the whole graph in the format Ctrl+C uses, so it pastes back with
   * Ctrl+V. Resolves `false` on failure, having reported it via `lastError`.
   */
  onCopyAll: () => Promise<boolean>
  /** Shows the search toggle; leave unset when there is no search to open. */
  search?: EditorToolbarSearch
  /** Extra classes for the toolbar's root element, merged into the package's own. */
  className?: string
}

/** The floating action bar: history, copying the graph and the search toggle. */
export function EditorToolbar({
  anchorRef,
  placement,
  showHistory = true,
  canUndo,
  canRedo,
  lastError,
  onUndo,
  onRedo,
  onClearError,
  canCopyAll,
  onCopyAll,
  search,
  className,
}: EditorToolbarProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const styles = editorToolbarStyles({ placement })
  const shownStatus = lastError ?? statusMessage

  const copyAll = async () => {
    const copied = await onCopyAll()
    setStatusMessage(copied ? "All nodes copied." : null)
  }

  return (
    <div ref={anchorRef} className={styles.root({ class: className })}>
      <div
        role="toolbar"
        aria-label="Editor actions"
        className={styles.bar()}
        data-testid="editor-toolbar"
      >
        {search ? (
          <ActionTooltip label="Search" shortcut={SEARCH_SHORTCUT}>
            <Toggle
              className={styles.toggle()}
              aria-label="Search"
              isSelected={search.isOpen}
              onChange={search.onOpenChange}
            >
              <SearchIcon />
            </Toggle>
          </ActionTooltip>
        ) : null}
        <ActionTooltip label="Copy all nodes">
          <Button
            size="icon-lg"
            variant="ghost"
            className={styles.button()}
            aria-label="Copy all nodes"
            isDisabled={!canCopyAll}
            onPress={() => {
              void copyAll()
            }}
          >
            <CopyIcon />
          </Button>
        </ActionTooltip>
        {showHistory ? (
          <>
            <span className={styles.separator()} aria-hidden="true" />
            <ActionTooltip label="Undo" shortcut={UNDO_SHORTCUT}>
              <Button
                size="icon-lg"
                variant="ghost"
                className={styles.button()}
                aria-label="Undo"
                isDisabled={!canUndo}
                onPress={onUndo}
              >
                <Undo2Icon />
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Redo" shortcut={REDO_SHORTCUT}>
              <Button
                size="icon-lg"
                variant="ghost"
                className={styles.button()}
                aria-label="Redo"
                isDisabled={!canRedo}
                onPress={onRedo}
              >
                <Redo2Icon />
              </Button>
            </ActionTooltip>
          </>
        ) : null}
      </div>

      {shownStatus ? (
        <div className={styles.status()} role="status">
          <span className={styles.statusText()}>{shownStatus}</span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onPress={() => {
              setStatusMessage(null)
              onClearError()
            }}
          >
            Dismiss
          </Button>
        </div>
      ) : null}
    </div>
  )
}
