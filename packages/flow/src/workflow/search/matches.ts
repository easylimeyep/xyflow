import { parseTemplateSegments } from "@flow/expression-editor"

import { forEachExpressionField } from "../expression/refactor/expression-fields"
import type { NodeRegistry } from "../node-registry/registry"
import type { WorkflowGroup, WorkflowNode } from "../types/types"

export type SearchMatchSource =
  | "label"
  | "variable-definition"
  | "variable-reference"

/**
 * Where a match sits in canvas order: node `y`, node `x`, source rank, field
 * index, text offset, node id. Compared lexicographically.
 */
export type SearchSortTuple = readonly [
  number,
  number,
  number,
  number,
  number,
  string,
]

interface SearchMatchBase {
  /** Stable identity across recomputes: target, source, field, occurrence. */
  key: string
  source: SearchMatchSource
  /** The n-th hit within this target's source and field. */
  occurrence: number
  /** Offsets into the searched text (the raw template for references). */
  start: number
  end: number
  sortTuple: SearchSortTuple
}

/** One occurrence of the query in a node. A node can contribute several. */
export interface NodeSearchMatch extends SearchMatchBase {
  target: "node"
  nodeId: string
  /** The expression field holding a reference; absent for other sources. */
  fieldPath?: string
}

/** One occurrence of the query in a group's label. */
export interface GroupSearchMatch extends SearchMatchBase {
  target: "group"
  groupId: string
  source: "label"
}

/**
 * One occurrence of the query. Nodes and group labels are both searched; a
 * group has no fields or variables, so its label is all it contributes.
 */
export type SearchMatch = NodeSearchMatch | GroupSearchMatch

export function isNodeSearchMatch(
  match: SearchMatch | null | undefined
): match is NodeSearchMatch {
  return match?.target === "node"
}

export function isGroupSearchMatch(
  match: SearchMatch | null | undefined
): match is GroupSearchMatch {
  return match?.target === "group"
}

/**
 * A group sorts ahead of a node at the same position: its header sits above
 * the members, so canvas order reaches it first.
 */
const GROUP_LABEL_RANK = -1

/** Every source, in the order a node's matches sort. */
export const SEARCH_MATCH_SOURCES: readonly SearchMatchSource[] = [
  "label",
  "variable-definition",
  "variable-reference",
]

const SOURCE_RANK: Record<SearchMatchSource, number> = {
  label: 0,
  "variable-definition": 1,
  "variable-reference": 2,
}

/** How the query is compared with the searched text. */
export interface SearchMatchOptions {
  /** Compare letter case as typed; off matches case-insensitively. */
  matchCase: boolean
  /** Only hits with no identifier character on either side. */
  wholeWord: boolean
}

export const DEFAULT_SEARCH_MATCH_OPTIONS: SearchMatchOptions = {
  matchCase: false,
  wholeWord: false,
}

// Letters of any script count, so a whole-word search in a Cyrillic label
// behaves as it does in a Latin one.
const IDENTIFIER_CHARACTER = /[\p{L}\p{N}_$]/u

function isWordBoundary(text: string, start: number, end: number): boolean {
  const before = start > 0 ? text[start - 1]! : ""
  const after = end < text.length ? text[end]! : ""
  return !IDENTIFIER_CHARACTER.test(before) && !IDENTIFIER_CHARACTER.test(after)
}

/**
 * Every non-overlapping hit of `needle` in `text[from, to)`. `needle` is
 * already lower-cased unless the options ask to match case.
 */
function findOccurrences(
  text: string,
  needle: string,
  options: SearchMatchOptions,
  from = 0,
  to = text.length
): number[] {
  const sliced = text.slice(0, to)
  const haystack = options.matchCase ? sliced : sliced.toLowerCase()
  const offsets: number[] = []
  let cursor = haystack.indexOf(needle, from)
  while (cursor !== -1) {
    const end = cursor + needle.length
    if (!options.wholeWord || isWordBoundary(haystack, cursor, end)) {
      offsets.push(cursor)
      cursor = haystack.indexOf(needle, end)
    } else {
      // A rejected candidate consumes nothing: `ratex rate` still finds
      // the second hit.
      cursor = haystack.indexOf(needle, cursor + 1)
    }
  }
  return offsets
}

/** Hits inside `{{…}}` segments only, as offsets into the raw template. */
function findReferenceOccurrences(
  template: string,
  needle: string,
  options: SearchMatchOptions
): number[] {
  return parseTemplateSegments(template)
    .filter((segment) => segment.type === "expression")
    .flatMap((segment) => {
      const bodyStart = segment.start + 2
      const bodyEnd = bodyStart + segment.value.length
      return findOccurrences(template, needle, options, bodyStart, bodyEnd)
    })
}

function collectNodeMatches(
  registry: NodeRegistry,
  node: WorkflowNode,
  needle: string,
  options: SearchMatchOptions
): NodeSearchMatch[] {
  const matches: NodeSearchMatch[] = []
  const push = (
    source: SearchMatchSource,
    fieldIndex: number,
    offsets: number[],
    fieldPath?: string
  ) => {
    offsets.forEach((start, occurrence) => {
      matches.push({
        key: `${node.id}|${source}|${fieldPath ?? ""}|${occurrence}`,
        target: "node",
        nodeId: node.id,
        source,
        ...(fieldPath === undefined ? {} : { fieldPath }),
        occurrence,
        start,
        end: start + needle.length,
        sortTuple: [
          node.position.y,
          node.position.x,
          SOURCE_RANK[source],
          fieldIndex,
          start,
          node.id,
        ],
      })
    })
  }

  push("label", 0, findOccurrences(node.data.label, needle, options))

  const definitionField = locateVariableDefinition(registry, node)
  if (definitionField) {
    push(
      "variable-definition",
      0,
      findOccurrences(definitionField.name, needle, options),
      definitionField.fieldPath
    )
  }

  let fieldIndex = 0
  forEachExpressionField(registry, node, ({ fieldPath, template }) => {
    push(
      "variable-reference",
      fieldIndex,
      findReferenceOccurrences(template, needle, options),
      fieldPath
    )
    fieldIndex += 1
  })

  return matches
}

function collectGroupMatches(
  group: WorkflowGroup,
  needle: string,
  options: SearchMatchOptions
): GroupSearchMatch[] {
  return findOccurrences(group.label, needle, options).map(
    (start, occurrence) => ({
      // Prefixed so a group id can never collide with a node id's key.
      key: `group:${group.id}|label||${occurrence}`,
      target: "group",
      groupId: group.id,
      source: "label",
      occurrence,
      start,
      end: start + needle.length,
      sortTuple: [group.y, group.x, GROUP_LABEL_RANK, 0, start, group.id],
    })
  )
}

export interface VariableDefinitionField {
  name: string
  /** The config key holding the name; absent when it cannot be located. */
  fieldPath?: string
}

/**
 * Where the node's variable name is held, or `null` when it should not be
 * reported as a match of its own.
 *
 * `variable()` reports a name, not its source. A kind that keeps the name in a
 * field of its own declares that field as `renameConfigKey`, so a match there
 * is anchored to it. A name that is the node label instead (the extractor's
 * fallback, the path extractor) is already reported as the label match, and a
 * second match on the same text would only be a duplicate step.
 */
export function locateVariableDefinition(
  registry: NodeRegistry,
  node: WorkflowNode
): VariableDefinitionField | null {
  const definition = registry.get(node.data.kind)
  const name = definition
    ?.variable?.({
      id: node.id,
      label: node.data.label,
      config: node.data.config,
    })
    ?.name.trim()
  if (!definition || !name) {
    return null
  }

  const key = definition.renameConfigKey
  const held = key ? node.data.config[key] : undefined
  if (key && typeof held === "string" && held.trim() === name) {
    return { name, fieldPath: key }
  }
  if (node.data.label.trim() === name) {
    return null
  }
  return { name }
}

export function compareSortTuples(
  a: SearchSortTuple,
  b: SearchSortTuple
): number {
  for (let index = 0; index < a.length; index += 1) {
    const left = a[index]!
    const right = b[index]!
    if (left === right) continue
    if (typeof left === "number" && typeof right === "number") {
      return left - right
    }
    return String(left) < String(right) ? -1 : 1
  }
  return 0
}

/**
 * Every occurrence of `query` in the graph — nodes and group labels — in
 * canvas order.
 *
 * Pure: a function of the nodes, the groups, the registry, the query and the
 * options. An empty or whitespace-only query matches nothing.
 */
export function buildSearchMatches(
  nodes: readonly WorkflowNode[],
  registry: NodeRegistry,
  query: string,
  options: SearchMatchOptions = DEFAULT_SEARCH_MATCH_OPTIONS,
  groups: readonly WorkflowGroup[] = []
): SearchMatch[] {
  const trimmed = query.trim()
  const needle = options.matchCase ? trimmed : trimmed.toLowerCase()
  if (!needle) {
    return []
  }
  const matches: SearchMatch[] = nodes.flatMap((node) =>
    collectNodeMatches(registry, node, needle, options)
  )
  for (const group of groups) {
    matches.push(...collectGroupMatches(group, needle, options))
  }
  return matches.sort((a, b) => compareSortTuples(a.sortTuple, b.sortTuple))
}

/**
 * The current match after the match list was recomputed.
 *
 * Kept by key when it still exists; otherwise the nearest match that sorts
 * after where the old one stood; otherwise the first match; `null` when
 * nothing matches.
 */
export function reconcileCurrentMatch<TMatch extends SearchMatch>(
  prevKey: string | null,
  prevSortTuple: SearchSortTuple | null,
  nextMatches: readonly TMatch[]
): TMatch | null {
  if (nextMatches.length === 0) {
    return null
  }
  const kept = prevKey && nextMatches.find((match) => match.key === prevKey)
  if (kept) {
    return kept
  }
  const following =
    prevSortTuple &&
    nextMatches.find(
      (match) => compareSortTuples(match.sortTuple, prevSortTuple) > 0
    )
  return following || nextMatches[0]!
}
