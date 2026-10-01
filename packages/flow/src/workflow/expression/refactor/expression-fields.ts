import type { NodeKind, NodeRegistry } from "../../node-registry/registry"
import type { JsonValue, WorkflowNode } from "../../types/types"

/** One expression-bearing string inside a node's config. */
export interface ExpressionField {
  /**
   * Where the template lives: `key` for a string, `key[i]` for a string-array
   * entry, and for a structured value the path its kind reports (such as
   * `conditions[<id>].left`) or, without one, `key#n` for its n-th template.
   */
  fieldPath: string
  template: string
}

/**
 * Rewrites one expression template. Must return the template it was given when
 * nothing changed, so an untouched node keeps its identity.
 */
export type ExpressionFieldRewrite = (field: ExpressionField) => string

/**
 * The single answer to "where do expressions live in this node".
 *
 * Every expression-bearing string is handed to `rewrite` in a deterministic
 * order: expression-ui text fields, then `extraExpressionConfigKeys`, then a
 * template-like `renameConfigKey`, then templates nested in structured values
 * that the kind's `refactorConfigValue` reaches. Rename and search both build
 * on this walk, so a field one of them reaches is always reached by the other.
 *
 * Returns the same node when no template changed.
 */
export function mapExpressionFields(
  registry: NodeRegistry,
  node: WorkflowNode,
  rewrite: ExpressionFieldRewrite
): WorkflowNode {
  const definition = registry.get(node.data.kind as NodeKind)
  // A node whose kind is not registered has no declared fields, so nothing in
  // its config can be an expression.
  if (!definition) {
    return node
  }

  let configChanged = false
  const nextConfig = { ...node.data.config }
  const setConfigValue = (key: string, nextValue: JsonValue) => {
    nextConfig[key] = nextValue
    configChanged = true
  }

  getExpressionConfigKeys(registry, node).forEach((key) => {
    const value = nextConfig[key]
    if (typeof value === "string") {
      const nextValue = rewrite({ fieldPath: key, template: value })
      if (nextValue !== value) {
        setConfigValue(key, nextValue)
      }
      return
    }

    if (
      !Array.isArray(value) ||
      !value.every((entry) => typeof entry === "string")
    ) {
      return
    }

    const nextValue = value.map((entry, index) =>
      rewrite({ fieldPath: `${key}[${index}]`, template: entry })
    )
    if (nextValue.some((entry, index) => entry !== value[index])) {
      setConfigValue(key, nextValue)
    }
  })

  const { refactorConfigValue } = definition
  if (refactorConfigValue) {
    Object.entries(nextConfig).forEach(([key, value]) => {
      let nestedIndex = 0
      const nextValue = refactorConfigValue(key, value, (template, path) => {
        const fieldPath = path ?? `${key}#${nestedIndex}`
        nestedIndex++
        return rewrite({ fieldPath, template })
      })
      if (nextValue !== value) {
        setConfigValue(key, nextValue)
      }
    })
  }

  if (!configChanged) {
    return node
  }

  return {
    ...node,
    data: {
      ...node.data,
      config: nextConfig,
    },
  }
}

/** Visits every expression field of a node without changing it. */
export function forEachExpressionField(
  registry: NodeRegistry,
  node: WorkflowNode,
  visit: (field: ExpressionField) => void
): void {
  mapExpressionFields(registry, node, (field) => {
    visit(field)
    return field.template
  })
}

function getExpressionConfigKeys(
  registry: NodeRegistry,
  node: WorkflowNode
): string[] {
  const definition = registry.get(node.data.kind as NodeKind)
  if (!definition) {
    return []
  }
  const fieldKeys = definition.fields
    .filter(
      (field) =>
        field.ui === "expression" &&
        (field.type === "text" || field.type === "textarea")
    )
    .map((field) => field.key)
  const templateLikeRenameKey =
    definition.renameConfigKey &&
    typeof node.data.config[definition.renameConfigKey] === "string" &&
    String(node.data.config[definition.renameConfigKey]).includes("{{")
      ? [definition.renameConfigKey]
      : []

  // A key declared twice (a field that is also an extra key) is still one
  // field: visiting it twice would double-count it in search.
  return [
    ...new Set([
      ...fieldKeys,
      ...(definition.extraExpressionConfigKeys ?? []),
      ...templateLikeRenameKey,
    ]),
  ]
}
