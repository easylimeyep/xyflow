import type { NodeProps } from "@xyflow/react"
import type { LucideIcon } from "lucide-react"
import type { ComponentType } from "react"

import type { JsonObject, NodeFieldSchema } from "../types/types"

export type NodeCategory = "control" | "logic" | "data" | "io"

export interface OutputHandle {
  id?: string | null
  top?: string
  label?: string
  labelClassName?: string
}

export interface NodeDefinition<K extends string = string> {
  kind: K
  title: string
  description: string
  icon: LucideIcon
  category: NodeCategory

  fields: NodeFieldSchema[]
  buildDefaultConfig: () => JsonObject

  outputPaths: string[]
  allowedTargets: string[]

  outputs?: OutputHandle[]
  showTarget?: boolean
  subtitle?: (config: Record<string, unknown>) => string
  inlineFields?: NodeFieldSchema[]
  extraExpressionConfigKeys?: string[]
  renameConfigKey?: string
  /**
   * A bespoke renderer for this kind.
   *
   * Optional: a definition without one renders through `DefaultNodeRenderer`,
   * which draws any node from its `fields`. Declaring a view is how a kind opts
   * out of that generic treatment.
   *
   * Wire this in the node's `index.ts`, never in `definition.ts` — a component
   * imports its own definition for `fields` (see
   * `nodes/logic/evaluator/component.tsx`), so the reverse import would cycle.
   */
  view?: ComponentType<NodeProps>
  validateConfigValue?: (key: string, value: unknown) => boolean
  normalizeConfigValue?: (key: string, value: unknown) => unknown
}

export function defineNode<K extends string>(
  definition: NodeDefinition<K>
): NodeDefinition<K> {
  return definition
}

/**
 * The config keys a kind supports.
 *
 * `fields` is what a definition declares as editable; `buildDefaultConfig` is
 * what a freshly dropped node starts with. They coincide only when every field
 * has a sensible seed — a definition deriving its fields from a schema must
 * leave a constrained optional key unseeded rather than invent a value for it.
 * So the surface is the union, in declaration order: fields first, then any key
 * the default config adds on its own.
 */
export function getNodeConfigKeys(
  definition: NodeDefinition
): readonly string[] {
  const declared = [
    ...definition.fields.map((field) => field.key),
    ...(definition.inlineFields ?? []).map((field) => field.key),
    ...Object.keys(definition.buildDefaultConfig()),
  ]

  return [...new Set(declared)]
}
