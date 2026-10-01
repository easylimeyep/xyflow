"use client"

import { type Ref, useState } from "react"

import { Button } from "@flow/ui/components/button"
import { Toggle } from "@flow/ui/components/toggle"
import { CopyIcon, Redo2Icon, SearchIcon, Undo2Icon } from "lucide-react"
import { AnimatePresence, MotionConfig, motion } from "motion/react"

import { editorToolbarStyles } from "../../../styles/components/editor-shell"
import { ActionTooltip } from "../action-tooltip"
import { useElementSize } from "./use-element-size"

const UNDO_SHORTCUT = ["Ctrl+Z"]
const REDO_SHORTCUT = ["Ctrl+Shift+Z"]
const SEARCH_SHORTCUT = ["Ctrl+F"]

// No bounce: the bar is centred while its content hugs the left edge, so any
// overshoot in width would swing the content left and back right.
const BAR_TRANSITION = { type: "spring", bounce: 0, duration: 0.35 } as const
const CONTENT_ENTER = {
  initial: { opacity: 0, filter: "blur(2px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
}

export interface EditorToolbarSearch {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  /**
   * Set while the search bar renders into `searchHostRef`: opening search then
   * unfolds the toolbar into the bar in place of its actions.
   */
  isEmbedded?: boolean
}

export interface EditorToolbarProps {
  anchorRef?: Ref<HTMLDivElement>
  /**
   * Receives the element inside the bar that an embedded search renders into.
   * It is mounted whether or not search is offered, so a search part can find
   * it before it registers.
   */
  searchHostRef?: Ref<HTMLDivElement>
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

/**
 * The floating action bar: history, copying the graph and the search toggle.
 * It follows its content's size with a spring, so an embedded search unfolds
 * the bar in place rather than opening beside it.
 */
export function EditorToolbar({
  anchorRef,
  searchHostRef,
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
  const [contentRef, contentSize] = useElementSize<HTMLDivElement>()
  const isSearchShown = Boolean(search?.isOpen && search.isEmbedded)
  const styles = editorToolbarStyles({ placement, searchOpen: isSearchShown })
  const shownStatus = lastError ?? statusMessage

  const copyAll = async () => {
    const copied = await onCopyAll()
    setStatusMessage(copied ? "All nodes copied." : null)
  }

  return (
    <div ref={anchorRef} className={styles.root({ class: className })}>
      <MotionConfig transition={BAR_TRANSITION} reducedMotion="user">
        <motion.div
          role="toolbar"
          aria-label="Editor actions"
          className={styles.bar()}
          data-testid="editor-toolbar"
          initial={false}
          animate={{
            // From `auto` until the first measurement, so the first resize
            // already animates from a real size.
            width: contentSize?.width ?? "auto",
            height: contentSize?.height ?? "auto",
          }}
        >
          <div ref={contentRef} className={styles.content()}>
            <AnimatePresence initial={false}>
              {isSearchShown ? null : (
                <motion.div
                  key="actions"
                  className={styles.actions()}
                  {...CONTENT_ENTER}
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
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              ref={searchHostRef}
              hidden={!isSearchShown}
              initial={false}
              animate={CONTENT_ENTER[isSearchShown ? "animate" : "initial"]}
              data-testid="editor-toolbar-search-host"
            />
          </div>
        </motion.div>
      </MotionConfig>

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
