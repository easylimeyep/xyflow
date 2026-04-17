import type { Edge, Node, Viewport, XYPosition } from "@xyflow/react"

export type { NodeKind } from "../node-registry/registry"
export { WORKFLOW_NODE_KINDS, isNodeKind } from "../node-registry/registry"

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonArray
export type JsonObject = { [key: string]: JsonValue }
export type JsonArray = JsonValue[]

export type FieldType = "text" | "textarea" | "number" | "boolean" | "select"
export type FieldUi = "default" | "expression"

export interface FieldOption {
  label: string
  value: string
}

export interface NodeFieldSchema {
  key: string
  label: string
  type: FieldType
  ui?: FieldUi
  description?: string
  placeholder?: string
  options?: FieldOption[]
}

export interface ExpressionVariableOption {
  value: string
  label: string
  description: string
  group: string
}

export type ConditionOperator =
  | "is equal to"
  | "is not equal to"
  | "contains"
  | "does not contain"
  | "starts with"
  | "ends with"
  | "is greater than"
  | "is less than"
  | "is greater or equal"
  | "is less or equal"
  | "is empty"
  | "is not empty"
  | "is null"
  | "is not null"
  | "is true"
  | "is false"

export const OPERATORS_WITH_TARGET: ConditionOperator[] = [
  "is equal to",
  "is not equal to",
  "contains",
  "does not contain",
  "starts with",
  "ends with",
  "is greater than",
  "is less than",
  "is greater or equal",
  "is less or equal",
]

export const ALL_CONDITION_OPERATORS: ConditionOperator[] = [
  "is equal to",
  "is not equal to",
  "contains",
  "does not contain",
  "starts with",
  "ends with",
  "is greater than",
  "is less than",
  "is greater or equal",
  "is less or equal",
  "is empty",
  "is not empty",
  "is null",
  "is not null",
  "is true",
  "is false",
]

export interface BranchCondition {
  id: string
  value: string
  operator: ConditionOperator
  targetValue?: string
}

export type BranchNodeConfig = {
  conditions: BranchCondition[]
  logicalOperator: "and" | "or"
}

export type InlineExpressionNodeConfig = {
  template: string[]
  isRoot: boolean
  repeatable: boolean
}

export type SetVariableNodeConfig = {
  variableName: string
  valueExpression: string
}

export type ExtractorNodeConfig = {
  tokenNumber: number
  extractExpression: string
  unlimited: boolean
}

export type ResultNodeConfig = {
  category: "true" | "false"
}

export interface NodeConfigByKind {
  branch: BranchNodeConfig
  setVariable: SetVariableNodeConfig
  inlineExpression: InlineExpressionNodeConfig
  extractor: ExtractorNodeConfig
  result: ResultNodeConfig
}

export interface BaseWorkflowNodeData {
  [key: string]: unknown
  kind: string
  label: string
  config: JsonObject
}

export type WorkflowNodeData = BaseWorkflowNodeData

export type WorkflowNode = Node<WorkflowNodeData>

export interface WorkflowEdgeData {
  [key: string]: unknown
  sourceKind: string
  targetKind: string
}

export type WorkflowEdge = Edge<WorkflowEdgeData>

export interface WorkflowGraphState {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  viewport: Viewport
  document: {
    id: string
    name: string
    version: number
    metadata: JsonObject
  }
}

export interface DomainWorkflowNodeDTO {
  id: string
  kind: string
  position: XYPosition
  label: string
  config: JsonObject
}

export interface DomainWorkflowConnectionDTO {
  id: string
  sourceNodeId: string
  targetNodeId: string
  sourceHandle: string | null
  targetHandle: string | null
}

export interface DomainWorkflowDTO {
  id: string
  name: string
  version: number
  metadata: JsonObject
  nodes: DomainWorkflowNodeDTO[]
  connections: DomainWorkflowConnectionDTO[]
  viewport: Viewport
}
