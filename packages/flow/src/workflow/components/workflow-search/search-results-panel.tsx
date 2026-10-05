"use client"

import { useEffect, useMemo, type KeyboardEvent, type RefObject } from "react"

import { Button } from "@flow/ui/components/button"
import {
  Collection,
  ListBox,
  ListBoxHeader,
  ListBoxItem,
  ListBoxSection,
  ListLayout,
  Virtualizer,
} from "@flow/ui/components/list-box"
import { ToggleGroup, ToggleGroupItem } from "@flow/ui/components/toggle-group"
import { Group as GroupIcon } from "lucide-react"

import {
  SEARCH_RESULT_HEADING_SIZE,
  SEARCH_RESULT_ROW_SIZE,
  searchResultsPanelStyles,
} from "../../../styles/components/panels"
import type { NodeRegistry } from "../../node-registry/registry"
import {
  describeGroupSearchMatch,
  describeSearchMatch,
  type SearchMatchDescription,
} from "../../search/describe-match"
import {
  SEARCH_MATCH_SOURCES,
  type SearchMatch,
  type SearchMatchSource,
} from "../../search/matches"
import {
  selectCurrentSearchMatch,
  selectSearchHiddenByFilters,
  selectSearchMatches,
  selectSearchSourceCounts,
  useWorkflowShallowStore,
  type WorkflowStoreState,
} from "../../store"
import type { SearchSourceFilter } from "../../store/types"
import type { WorkflowGroup, WorkflowNode } from "../../types/types"

const SOURCE_LABELS: Record<SearchMatchSource, string> = {
  label: "Labels",
  "variable-definition": "Variables",
  "variable-reference": "References",
}

/** What a results section stands for: a node, or a group's label. */
type ResultTarget =
  | { kind: "node"; node: WorkflowNode }
  | { kind: "group"; group: WorkflowGroup }

interface ResultRow {
  id: string
  /** One-based position in the match set: the `N` of the counter. */
  position: number
  match: SearchMatch
  target: ResultTarget
}

interface ResultGroup {
  id: string
  target: ResultTarget
  rows: ResultRow[]
}

function targetLabel(target: ResultTarget): string {
  return target.kind === "node" ? target.node.data.label : target.group.label
}

/**
 * Matches grouped by node (or by group, for group labels), sections in order
 * of each target's first match.
 */
function groupMatches(
  matches: readonly SearchMatch[],
  nodes: readonly WorkflowNode[],
  groups: readonly WorkflowGroup[]
): ResultGroup[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const groupsById = new Map(groups.map((group) => [group.id, group]))
  const sections = new Map<string, ResultGroup>()
  matches.forEach((match, index) => {
    let id: string
    let target: ResultTarget
    if (match.target === "group") {
      const group = groupsById.get(match.groupId)
      if (!group) return
      id = `group:${group.id}`
      target = { kind: "group", group }
    } else {
      const node = nodesById.get(match.nodeId)
      if (!node) return
      id = node.id
      target = { kind: "node", node }
    }
    const section = sections.get(id) ?? { id, target, rows: [] }
    section.rows.push({ id: match.key, position: index + 1, match, target })
    sections.set(id, section)
  })
  return [...sections.values()]
}

function selectPanelView(state: WorkflowStoreState) {
  return {
    query: state.search.query,
    sources: state.search.sources,
    matches: selectSearchMatches(state),
    currentKey: selectCurrentSearchMatch(state)?.key ?? null,
    sourceCounts: selectSearchSourceCounts(state),
    hiddenByFilters: selectSearchHiddenByFilters(state),
    nodes: state.graph.nodes,
    groups: state.graph.groups,
    registry: state.registry,
    setSearchCurrentMatch: state.setSearchCurrentMatch,
    setSearchSources: state.setSearchSources,
    resetSearchSources: state.resetSearchSources,
  }
}

export interface SearchResultsPanelProps {
  id: string
  /** Where `Escape` inside the panel hands focus back to. */
  inputRef: RefObject<HTMLInputElement | null>
  /** The scrolling list element, so the bar can move focus into it. */
  listRef: RefObject<HTMLDivElement | null>
}

/**
 * The expanded part of the search bar: source filters and every match,
 * grouped by node. Picking a row makes its match current; the bar's reveal
 * effect then centres the node, as it does for next and previous.
 */
export function SearchResultsPanel({
  id,
  inputRef,
  listRef,
}: SearchResultsPanelProps) {
  const {
    query,
    sources,
    matches,
    currentKey,
    sourceCounts,
    hiddenByFilters,
    nodes,
    groups,
    registry,
    setSearchCurrentMatch,
    setSearchSources,
    resetSearchSources,
  } = useWorkflowShallowStore(selectPanelView)
  const styles = searchResultsPanelStyles()
  const sections = useMemo(
    () => groupMatches(matches, nodes, groups),
    [groups, matches, nodes]
  )
  // An instance rather than the class, so the current row's position can be
  // read back for scrolling without the list holding focus.
  const layout = useMemo(
    () =>
      new ListLayout({
        rowSize: SEARCH_RESULT_ROW_SIZE,
        headingSize: SEARCH_RESULT_HEADING_SIZE,
      }),
    []
  )

  // Keyed on the current match only: a graph edit recomputes the list but
  // must not yank a user who is reading further down.
  useEffect(() => {
    const list = listRef.current
    const rect = currentKey ? layout.getLayoutInfo(currentKey)?.rect : null
    if (!list || !rect) {
      return
    }
    if (rect.y < list.scrollTop) {
      list.scrollTop = Math.max(0, rect.y - SEARCH_RESULT_HEADING_SIZE)
    } else if (rect.maxY > list.scrollTop + list.clientHeight) {
      list.scrollTop = rect.maxY - list.clientHeight
    }
  }, [currentKey, layout, listRef])

  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") {
      return
    }
    // Back to the query, never closing the search or reaching the canvas.
    event.preventDefault()
    event.stopPropagation()
    inputRef.current?.focus()
  }

  const onSourcesChange = (keys: Set<string | number>) => {
    const next = Object.fromEntries(
      SEARCH_MATCH_SOURCES.map((source) => [source, keys.has(source)])
    ) as SearchSourceFilter
    setSearchSources(next)
  }

  return (
    <div
      id={id}
      className={styles.panel()}
      data-testid="workflow-search-results"
      onKeyDownCapture={onKeyDownCapture}
    >
      <ToggleGroup
        aria-label="Match sources"
        selectionMode="multiple"
        size="sm"
        spacing={1}
        className={styles.filters()}
        selectedKeys={SEARCH_MATCH_SOURCES.filter((source) => sources[source])}
        onSelectionChange={onSourcesChange}
      >
        {SEARCH_MATCH_SOURCES.map((source) => (
          <ToggleGroupItem
            key={source}
            id={source}
            className={styles.filterItem()}
          >
            {SOURCE_LABELS[source]}
            <span className={styles.filterCount()}>{sourceCounts[source]}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {matches.length > 0 ? (
        <Virtualizer layout={layout}>
          <ListBox
            ref={listRef}
            aria-label="Search results"
            className={styles.list()}
            items={sections}
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={currentKey ? [currentKey] : []}
            onSelectionChange={(keys) => {
              const [key] = keys === "all" ? [] : [...keys]
              if (typeof key === "string") {
                setSearchCurrentMatch(key)
              }
            }}
          >
            {(group) => (
              <ListBoxSection id={group.id}>
                <SearchResultHeader group={group} registry={registry} />
                <Collection items={group.rows}>
                  {(row) => <SearchResultRow row={row} registry={registry} />}
                </Collection>
              </ListBoxSection>
            )}
          </ListBox>
        </Virtualizer>
      ) : (
        <p className={styles.emptyState()} data-testid="workflow-search-empty">
          {!query.trim() ? (
            "Type to find labels, variables and references."
          ) : hiddenByFilters > 0 ? (
            <>
              {hiddenByFilters === 1
                ? "1 match hidden by filters."
                : `${hiddenByFilters} matches hidden by filters.`}
              <Button size="xs" variant="outline" onPress={resetSearchSources}>
                Reset filters
              </Button>
            </>
          ) : (
            "No matches."
          )}
        </p>
      )}
    </div>
  )
}

function SearchResultHeader({
  group,
  registry,
}: {
  group: ResultGroup
  registry: NodeRegistry
}) {
  const styles = searchResultsPanelStyles()
  const { target } = group
  const definition =
    target.kind === "node" ? registry.get(target.node.data.kind) : undefined
  const Icon = target.kind === "group" ? GroupIcon : definition?.icon
  const kindTitle = target.kind === "group" ? "Group" : definition?.title
  return (
    <ListBoxHeader className={styles.groupHeader()}>
      {Icon ? <Icon className={styles.groupIcon()} aria-hidden /> : null}
      <span className={styles.groupLabel()}>{targetLabel(target)}</span>
      {kindTitle ? (
        <span className={styles.groupKind()}>{kindTitle}</span>
      ) : null}
      <span className={styles.groupCount()}>{group.rows.length}</span>
    </ListBoxHeader>
  )
}

function describeRow(
  registry: NodeRegistry,
  row: ResultRow
): SearchMatchDescription {
  const { match, target } = row
  if (target.kind === "group" && match.target === "group") {
    return describeGroupSearchMatch(target.group, match)
  }
  if (target.kind === "node" && match.target === "node") {
    return describeSearchMatch(registry, target.node, match)
  }
  throw new Error(`Search result ${row.id} does not match its section.`)
}

function SearchResultRow({
  row,
  registry,
}: {
  row: ResultRow
  registry: NodeRegistry
}) {
  const styles = searchResultsPanelStyles()
  const { fieldName, snippet } = describeRow(registry, row)
  return (
    <ListBoxItem
      id={row.id}
      textValue={`${targetLabel(row.target)}, ${fieldName}, ${snippet.before}${snippet.hit}${snippet.after}`}
      className={styles.row()}
      data-testid="workflow-search-result"
    >
      <span className={styles.rowIndex()}>{row.position}</span>
      <span className={styles.rowField()}>{fieldName}</span>
      <span className={styles.snippet()}>
        {snippet.clippedStart ? "…" : ""}
        {snippet.before}
        <mark className={styles.hit()}>{snippet.hit}</mark>
        {snippet.after}
        {snippet.clippedEnd ? "…" : ""}
      </span>
    </ListBoxItem>
  )
}
