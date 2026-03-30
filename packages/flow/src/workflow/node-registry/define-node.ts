import type { LucideIcon } from "lucide-react"
import type { ComponentType } from "react"
import type { NodeProps } from "@xyflow/react"

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
  component?: ComponentType<NodeProps>
}

export function defineNode<K extends string>(definition: NodeDefinition<K>): NodeDefinition<K> {
  return definition
}
