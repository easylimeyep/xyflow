import type { NodeRegistry } from "../node-registry/registry"
import {
  buildSearchMatches,
  reconcileCurrentMatch,
  SEARCH_MATCH_SOURCES,
  type SearchMatch,
  type SearchMatchOptions,
  type SearchMatchSource,
  type SearchSortTuple,
} from "../search/matches"
import type { WorkflowNode } from "../types/types"
import type { SearchSourceFilter, WorkflowStoreState } from "./types"

export type NodeSearchStatus = "none" | "match" | "current"

/** Status of one field within a node; same values as a node's. */
export type FieldSearchStatus = NodeSearchStatus

/**
 * The field key of the node title. Config keys name every other field, and
 * one of them may well be called `label` (the evaluator's result label), so
 * the title takes a key no config key uses.
 */
export const SEARCH_TITLE_FIELD = ":title"

/** The field a match is marked on, or `undefined` when it has none. */
export function searchMatchFieldKey(match: SearchMatch): string | undefined {
  return match.source === "label" ? SEARCH_TITLE_FIELD : match.fieldPath
}

export interface FieldSearchStatusOptions {
  /**
   * Also answer for fields nested under this key (`key[<i>]`): a control that
   * stands in for a collapsed list of values carries its entries' marks.
   */
  includeChildren?: boolean
}

// Every node subscribes to its own search status, so these selectors run once
// per node on every store change. They must therefore answer from a cache that
// only moves when the graph, the query, the options or the sources do.
//
// Two layers: the full index is keyed by registry, which is per store
// instance, so two editors on one page never share one; the filtered view is
// keyed by the full list, so toggling a source never rescans the graph.
interface FullIndexCache {
  nodes: readonly WorkflowNode[]
  query: string
  options: SearchMatchOptions
  matches: SearchMatch[]
  /** Per source, how many of `matches` it holds. */
  sourceCounts: SearchSourceCounts
}

interface MatchIndexCache {
  sources: SearchSourceFilter
  /** The matches the enabled sources let through, in canvas order. */
  matches: SearchMatch[]
  matchedNodeIds: ReadonlySet<string>
  /** Per node, the field keys holding at least one match. */
  fieldKeysByNode: ReadonlyMap<string, ReadonlySet<string>>
  /** Every match the query and options yield, before the source filter. */
  full: FullIndexCache
}

interface CurrentMatchCache {
  key: string | null
  sortTuple: SearchSortTuple | null
  current: SearchMatch | null
}

/** Per source, how many matches the query and options yield. */
export type SearchSourceCounts = Readonly<Record<SearchMatchSource, number>>

const EMPTY_MATCHES: SearchMatch[] = []
const fullIndexCaches = new WeakMap<NodeRegistry, FullIndexCache>()
const matchIndexCaches = new WeakMap<SearchMatch[], MatchIndexCache>()
const currentMatchCaches = new WeakMap<SearchMatch[], CurrentMatchCache>()

function sameOptions(a: SearchMatchOptions, b: SearchMatchOptions): boolean {
  return a.matchCase === b.matchCase && a.wholeWord === b.wholeWord
}

function sameSources(a: SearchSourceFilter, b: SearchSourceFilter): boolean {
  return SEARCH_MATCH_SOURCES.every((source) => a[source] === b[source])
}

function fullIndexFor(state: WorkflowStoreState): FullIndexCache | null {
  const { isOpen, query, options } = state.search
  if (!isOpen || !query.trim()) {
    // Let a closed search release the last graph it indexed.
    fullIndexCaches.delete(state.registry)
    return null
  }

  const nodes = state.history.present.nodes
  const cached = fullIndexCaches.get(state.registry)
  if (
    cached &&
    cached.query === query &&
    sameOptions(cached.options, options)
  ) {
    // A drag rewrites positions every frame; the order it would produce is
    // settled once the drag ends and `nodeDragOriginGraph` clears.
    if (cached.nodes === nodes || state.nodeDragOriginGraph) {
      return cached
    }
  }

  const matches = buildSearchMatches(nodes, state.registry, query, options)
  const next: FullIndexCache = {
    nodes,
    query,
    options,
    matches,
    sourceCounts: countSources(matches),
  }
  fullIndexCaches.set(state.registry, next)
  return next
}

function matchIndexFor(state: WorkflowStoreState): MatchIndexCache | null {
  const full = fullIndexFor(state)
  if (!full) {
    return null
  }

  const { sources } = state.search
  const cached = matchIndexCaches.get(full.matches)
  if (cached && sameSources(cached.sources, sources)) {
    return cached
  }

  const matches = full.matches.every((match) => sources[match.source])
    ? full.matches
    : full.matches.filter((match) => sources[match.source])
  const next: MatchIndexCache = {
    sources,
    matches,
    matchedNodeIds: new Set(matches.map((match) => match.nodeId)),
    fieldKeysByNode: indexFieldKeys(matches),
    full,
  }
  matchIndexCaches.set(full.matches, next)
  return next
}

function countSources(matches: readonly SearchMatch[]): SearchSourceCounts {
  const counts: Record<SearchMatchSource, number> = {
    label: 0,
    "variable-definition": 0,
    "variable-reference": 0,
  }
  matches.forEach((match) => {
    counts[match.source] += 1
  })
  return counts
}

function indexFieldKeys(
  matches: readonly SearchMatch[]
): Map<string, Set<string>> {
  const byNode = new Map<string, Set<string>>()
  matches.forEach((match) => {
    const fieldKey = searchMatchFieldKey(match)
    if (fieldKey === undefined) {
      return
    }
    const keys = byNode.get(match.nodeId) ?? new Set<string>()
    keys.add(fieldKey)
    byNode.set(match.nodeId, keys)
  })
  return byNode
}

/** True when `candidate` is `fieldKey`, or nested in it with `includeChildren`. */
export function coversSearchFieldKey(
  candidate: string,
  fieldKey: string,
  includeChildren: boolean
): boolean {
  return (
    candidate === fieldKey ||
    (includeChildren && candidate.startsWith(`${fieldKey}[`))
  )
}

/** Every match in canvas order; empty while the search is closed. */
export function selectSearchMatches(state: WorkflowStoreState): SearchMatch[] {
  return matchIndexFor(state)?.matches ?? EMPTY_MATCHES
}

/** The match the user is on, reconciled against the latest graph. */
export function selectCurrentSearchMatch(
  state: WorkflowStoreState
): SearchMatch | null {
  const matches = selectSearchMatches(state)
  const { currentKey, currentSortTuple } = state.search
  const cached = currentMatchCaches.get(matches)
  if (
    cached &&
    cached.key === currentKey &&
    cached.sortTuple === currentSortTuple
  ) {
    return cached.current
  }

  const current = reconcileCurrentMatch(currentKey, currentSortTuple, matches)
  currentMatchCaches.set(matches, {
    key: currentKey,
    sortTuple: currentSortTuple,
    current,
  })
  return current
}

/** Zero-based position of the current match, or -1 without one. */
export function selectSearchCurrentIndex(state: WorkflowStoreState): number {
  const current = selectCurrentSearchMatch(state)
  return current ? selectSearchMatches(state).indexOf(current) : -1
}

export function selectSearchTotal(state: WorkflowStoreState): number {
  return selectSearchMatches(state).length
}

const NO_SOURCE_COUNTS: SearchSourceCounts = {
  label: 0,
  "variable-definition": 0,
  "variable-reference": 0,
}

/** Per source, how many matches the query and options yield, before filters. */
export function selectSearchSourceCounts(
  state: WorkflowStoreState
): SearchSourceCounts {
  return fullIndexFor(state)?.sourceCounts ?? NO_SOURCE_COUNTS
}

/** How many matches the disabled sources hide from the match set. */
export function selectSearchHiddenByFilters(state: WorkflowStoreState): number {
  const index = matchIndexFor(state)
  if (!index) {
    return 0
  }
  return index.full.matches.length - index.matches.length
}

/** True while any source is turned off. */
export function selectSearchIsFiltered(state: WorkflowStoreState): boolean {
  return SEARCH_MATCH_SOURCES.some((source) => !state.search.sources[source])
}

export function selectNodeSearchStatus(
  state: WorkflowStoreState,
  nodeId: string
): NodeSearchStatus {
  const index = matchIndexFor(state)
  if (!index || !index.matchedNodeIds.has(nodeId)) {
    return "none"
  }
  return selectCurrentSearchMatch(state)?.nodeId === nodeId
    ? "current"
    : "match"
}

/**
 * One field's place in the search. A string, so a field re-renders only when
 * its own status flips.
 */
export function selectFieldSearchStatus(
  state: WorkflowStoreState,
  nodeId: string,
  fieldKey: string,
  { includeChildren = false }: FieldSearchStatusOptions = {}
): FieldSearchStatus {
  const fieldKeys = matchIndexFor(state)?.fieldKeysByNode.get(nodeId)
  if (!fieldKeys) {
    return "none"
  }

  const current = selectCurrentSearchMatch(state)
  const currentFieldKey =
    current?.nodeId === nodeId ? searchMatchFieldKey(current) : undefined
  if (
    currentFieldKey !== undefined &&
    coversSearchFieldKey(currentFieldKey, fieldKey, includeChildren)
  ) {
    return "current"
  }

  for (const candidate of fieldKeys) {
    if (coversSearchFieldKey(candidate, fieldKey, includeChildren)) {
      return "match"
    }
  }
  return "none"
}

/**
 * True when this node holds the current match and that match has a field of
 * its own to carry the strong mark; the node then only needs an outline.
 */
export function selectNodeHasCurrentField(
  state: WorkflowStoreState,
  nodeId: string,
  /**
   * Which fields the node view actually renders. Defaults to the title only,
   * which every node shows: a view that draws more says so.
   */
  isFieldShown: (fieldKey: string) => boolean = (fieldKey) =>
    fieldKey === SEARCH_TITLE_FIELD
): boolean {
  const current = selectCurrentSearchMatch(state)
  if (current?.nodeId !== nodeId) {
    return false
  }
  const fieldKey = searchMatchFieldKey(current)
  return fieldKey !== undefined && isFieldShown(fieldKey)
}
