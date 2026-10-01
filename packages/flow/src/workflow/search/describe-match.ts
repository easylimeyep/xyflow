import { forEachExpressionField } from "../expression/refactor/expression-fields"
import type { NodeRegistry } from "../node-registry/registry"
import type { WorkflowNode } from "../types/types"
import { locateVariableDefinition, type SearchMatch } from "./matches"

/** Characters of context kept on each side of the matched text. */
export const SNIPPET_CONTEXT = 24

export interface SearchMatchSnippet {
  before: string
  hit: string
  after: string
  /** Text was cut before `before`. */
  clippedStart: boolean
  /** Text was cut after `after`. */
  clippedEnd: boolean
}

export interface SearchMatchDescription {
  /** Where the match sits, as the node shows it: "Tokens #2". */
  fieldName: string
  snippet: SearchMatchSnippet
}

const ARRAY_ENTRY_PATH = /^(.+)\[(\d+)\]$/

// A node object is replaced on every edit, so its templates can be indexed
// once and dropped with it.
const templatesByNode = new WeakMap<WorkflowNode, ReadonlyMap<string, string>>()

function templatesOf(
  registry: NodeRegistry,
  node: WorkflowNode
): ReadonlyMap<string, string> {
  const cached = templatesByNode.get(node)
  if (cached) {
    return cached
  }
  const templates = new Map<string, string>()
  forEachExpressionField(registry, node, ({ fieldPath, template }) => {
    templates.set(fieldPath, template)
  })
  templatesByNode.set(node, templates)
  return templates
}

/** `valueExpression` → "Value expression", for keys with no schema label. */
function humanizeKey(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function configKeyLabel(
  registry: NodeRegistry,
  node: WorkflowNode,
  key: string
): string {
  const definition = registry.get(node.data.kind)
  const field = [
    ...(definition?.fields ?? []),
    ...(definition?.inlineFields ?? []),
  ].find((candidate) => candidate.key === key)
  return field?.label ?? humanizeKey(key)
}

function describeReferenceField(
  registry: NodeRegistry,
  node: WorkflowNode,
  fieldPath: string
): string {
  if (/^[\w$]+$/.test(fieldPath)) {
    return configKeyLabel(registry, node, fieldPath)
  }
  const entry = ARRAY_ENTRY_PATH.exec(fieldPath)
  if (entry && /^[\w$]+$/.test(entry[1]!)) {
    return `${configKeyLabel(registry, node, entry[1]!)} #${Number(entry[2]) + 1}`
  }
  return (
    registry
      .get(node.data.kind)
      ?.describeExpressionField?.(fieldPath, node.data.config) ?? "Expression"
  )
}

function fieldNameOf(
  registry: NodeRegistry,
  node: WorkflowNode,
  match: SearchMatch
): string {
  switch (match.source) {
    case "label":
      return "Label"
    case "variable-definition":
      return match.fieldPath
        ? configKeyLabel(registry, node, match.fieldPath)
        : "Variable"
    case "variable-reference":
      return match.fieldPath
        ? describeReferenceField(registry, node, match.fieldPath)
        : "Expression"
  }
}

/** The text the match's offsets point into. */
function searchedTextOf(
  registry: NodeRegistry,
  node: WorkflowNode,
  match: SearchMatch
): string {
  switch (match.source) {
    case "label":
      return node.data.label
    case "variable-definition":
      return locateVariableDefinition(registry, node)?.name ?? ""
    case "variable-reference":
      return templatesOf(registry, node).get(match.fieldPath ?? "") ?? ""
  }
}

/** Collapses line breaks so a snippet stays on one line. */
function flatten(text: string): string {
  return text.replace(/\s*\n\s*/g, " ")
}

export function buildSnippet(
  text: string,
  start: number,
  end: number,
  context = SNIPPET_CONTEXT
): SearchMatchSnippet {
  const from = Math.max(0, start - context)
  const to = Math.min(text.length, end + context)
  return {
    before: flatten(text.slice(from, start)),
    hit: flatten(text.slice(start, end)),
    after: flatten(text.slice(end, to)),
    clippedStart: from > 0,
    clippedEnd: to < text.length,
  }
}

/** What a results row shows for one match: its field and a text snippet. */
export function describeSearchMatch(
  registry: NodeRegistry,
  node: WorkflowNode,
  match: SearchMatch
): SearchMatchDescription {
  return {
    fieldName: fieldNameOf(registry, node, match),
    snippet: buildSnippet(
      searchedTextOf(registry, node, match),
      match.start,
      match.end
    ),
  }
}
