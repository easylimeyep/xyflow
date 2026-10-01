"use client"

import { useEffect, useId, useRef, type KeyboardEvent } from "react"

import { Button } from "@flow/ui/components/button"
import { Input } from "@flow/ui/components/input"
import { Toggle } from "@flow/ui/components/toggle"
import { useEventCallback } from "@flow/ui/hooks/use-event-callback"
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CrosshairIcon,
  ListIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"

import {
  workflowSearchStyles,
  type WorkflowSearchPosition,
} from "../../../styles/components/panels"
import {
  selectCurrentSearchMatch,
  selectSearchCurrentIndex,
  selectSearchIsFiltered,
  selectSearchTotal,
  useWorkflowShallowStore,
  type WorkflowStoreState,
} from "../../store"
import { SearchResultsPanel } from "./search-results-panel"

export type { WorkflowSearchPosition }

export interface WorkflowSearchProps {
  /** Centers the canvas on a node; called whenever the current match moves. */
  onRevealNode?: (nodeId: string) => void
  /**
   * Receives a function that focuses and selects the query while the bar is
   * mounted, and `null` once it unmounts. `Mod+F` is only taken over while
   * one is registered, and uses it when search is already open.
   */
  onRegisterFocus?: (focus: (() => void) | null) => void
  /**
   * `floating` pins the bar over the top-right of the canvas; `inline` renders
   * it in flow for a host that gives it a place in its own layout.
   */
  placement?: "floating" | "inline"
  /**
   * Where a `floating` bar sits over the canvas: a corner, the middle of the
   * top or bottom edge, or the middle of the left or right edge. Defaults to
   * `top-right`. Along the bottom edge the results panel opens upwards.
   */
  position?: WorkflowSearchPosition
  /** Set while the floating node palette is open, so the bar moves clear of it. */
  besidePalette?: boolean
  /** Extra classes for the bar's root element, merged into the package's own. */
  className?: string
}

function selectSearchView(state: WorkflowStoreState) {
  return {
    isOpen: state.search.isOpen,
    query: state.search.query,
    total: selectSearchTotal(state),
    currentIndex: selectSearchCurrentIndex(state),
    currentKey: selectCurrentSearchMatch(state)?.key ?? null,
    currentNodeId: selectCurrentSearchMatch(state)?.nodeId ?? null,
    isResultsOpen: state.search.isResultsOpen,
    isFiltered: selectSearchIsFiltered(state),
    matchCase: state.search.options.matchCase,
    wholeWord: state.search.options.wholeWord,
    setSearchQuery: state.setSearchQuery,
    toggleSearchResults: state.toggleSearchResults,
    setSearchOption: state.setSearchOption,
    closeSearch: state.closeSearch,
    searchNext: state.searchNext,
    searchPrev: state.searchPrev,
    selectCurrentSearchNode: state.selectCurrentSearchNode,
    syncSearchCurrentMatch: state.syncSearchCurrentMatch,
  }
}

function formatCounter(query: string, total: number, currentIndex: number) {
  if (!query.trim()) {
    return ""
  }
  if (total === 0) {
    return "No results"
  }
  return `${currentIndex + 1} / ${total}`
}

/** The counter's accessible name, which also says what pressing it does. */
function describeCounter(
  counter: string,
  total: number,
  currentIndex: number,
  isFiltered: boolean
) {
  const position =
    total > 0 ? `Match ${currentIndex + 1} of ${total}` : counter || "Matches"
  return `${position}${isFiltered ? ", filtered" : ""}, show all matches`
}

/**
 * The editor-style find bar: query, `N / M`, previous/next, select and close.
 * Renders nothing while search is closed.
 */
export function WorkflowSearch({
  onRevealNode,
  onRegisterFocus,
  placement,
  position,
  besidePalette,
  className,
}: WorkflowSearchProps) {
  const {
    isOpen,
    query,
    total,
    currentIndex,
    currentKey,
    currentNodeId,
    isResultsOpen,
    isFiltered,
    matchCase,
    wholeWord,
    setSearchQuery,
    toggleSearchResults,
    setSearchOption,
    closeSearch,
    searchNext,
    searchPrev,
    selectCurrentSearchNode,
    syncSearchCurrentMatch,
  } = useWorkflowShallowStore(selectSearchView)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  // Where focus was before the bar opened, so closing hands it back instead
  // of dropping it on the document body — outside the editor.
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const hasMatches = total > 0
  const isEmpty = query.trim().length > 0 && !hasMatches
  const styles = workflowSearchStyles({
    placement,
    position,
    besidePalette,
    empty: isEmpty,
  })

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const active = document.activeElement
    returnFocusRef.current = active instanceof HTMLElement ? active : null
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [isOpen])

  // Registered for as long as the bar is mounted, open or not: its presence
  // is what tells the editor that Mod+F has somewhere to go.
  useEffect(() => {
    if (!onRegisterFocus) {
      return
    }

    onRegisterFocus(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => onRegisterFocus(null)
  }, [onRegisterFocus])

  // Keyed on the match: every step re-centres, including a step to another
  // match in the same node, while an edit elsewhere keeps the key and so
  // leaves the viewport alone. Whatever the latest graph resolved the current
  // match to is then stored, so later edits keep it by identity.
  const reveal = useEventCallback((nodeId: string) => onRevealNode?.(nodeId))
  useEffect(() => {
    if (currentKey && currentNodeId) {
      reveal(currentNodeId)
      syncSearchCurrentMatch()
    }
  }, [currentKey, currentNodeId, reveal, syncSearchCurrentMatch])

  if (!isOpen) {
    return null
  }

  const close = () => {
    // Resolved before closing unmounts the bar. When the element that had
    // focus is gone (a deleted node), the editor root keeps focus inside the
    // editor, so the next Mod+F still reaches it.
    const returnFocus = returnFocusRef.current?.isConnected
      ? returnFocusRef.current
      : rootRef.current?.closest<HTMLElement>("[data-workflow-editor-root]")
    closeSearch()
    returnFocus?.focus()
  }

  const focusResults = () => {
    const list = listRef.current
    if (!list) {
      return false
    }
    const current = currentKey
      ? list.querySelector<HTMLElement>(
          `[data-key="${CSS.escape(currentKey)}"]`
        )
      : null
    ;(current ?? list).focus()
    return true
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && isResultsOpen) {
      if (focusResults()) {
        event.preventDefault()
      }
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()
      if (event.shiftKey) {
        searchPrev()
      } else {
        searchNext()
      }
      return
    }

    if (event.key === "Escape") {
      // Handled here so it never reaches the canvas's Escape handling.
      event.preventDefault()
      event.stopPropagation()
      close()
    }
  }

  const counter = formatCounter(query, total, currentIndex)

  return (
    <div
      ref={rootRef}
      role="search"
      aria-label="Search workflow"
      className={styles.root({ class: className })}
      data-position={
        placement === "inline" ? undefined : (position ?? "top-right")
      }
      data-testid="workflow-search"
    >
      <div className={styles.bar()}>
        <SearchIcon className={styles.icon()} aria-hidden />
        <Input
          ref={inputRef}
          aria-label="Search nodes and variables"
          placeholder="Find in workflow"
          className={styles.input()}
          value={query}
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <Toggle
          size="sm"
          className={styles.option()}
          aria-label="Match case"
          isSelected={matchCase}
          onChange={(value) => setSearchOption("matchCase", value)}
        >
          Aa
        </Toggle>
        <Toggle
          size="sm"
          className={styles.option()}
          aria-label="Match whole word"
          isSelected={wholeWord}
          onChange={(value) => setSearchOption("wholeWord", value)}
        >
          ab
        </Toggle>
        <Button
          size="sm"
          variant="ghost"
          className={styles.counter()}
          aria-expanded={isResultsOpen}
          aria-controls={isResultsOpen ? panelId : undefined}
          aria-label={describeCounter(counter, total, currentIndex, isFiltered)}
          onPress={toggleSearchResults}
          data-testid="workflow-search-counter"
        >
          {counter || <ListIcon aria-hidden />}
          {isFiltered ? (
            <span
              className={styles.filterDot()}
              aria-hidden
              data-testid="workflow-search-filtered"
            />
          ) : null}
        </Button>
        <span className={styles.liveRegion()} aria-live="polite">
          {counter}
        </span>
        <span className={styles.divider()} aria-hidden />
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Previous match"
          isDisabled={!hasMatches}
          onPress={searchPrev}
        >
          <ChevronUpIcon />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Next match"
          isDisabled={!hasMatches}
          onPress={searchNext}
        >
          <ChevronDownIcon />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Select node"
          isDisabled={!hasMatches}
          onPress={selectCurrentSearchNode}
        >
          <CrosshairIcon />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Close search"
          onPress={close}
        >
          <XIcon />
        </Button>
      </div>
      {isResultsOpen ? (
        <SearchResultsPanel
          id={panelId}
          inputRef={inputRef}
          listRef={listRef}
        />
      ) : null}
    </div>
  )
}
