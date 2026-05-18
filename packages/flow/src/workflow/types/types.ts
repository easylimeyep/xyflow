import type { Edge, Node, Viewport, XYPosition } from "@xyflow/react"
import type { NodeKind } from "../node-registry/registry"
import type { WorkflowVariableType } from "./variable-types"

export type { ExpressionVariableOption } from "@workspace/expression-editor"
export type { WorkflowVariableType } from "./variable-types"
export { WORKFLOW_VARIABLE_TYPES } from "./variable-types"

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

export type ConditionOperator = string

export interface WorkflowEvaluatorOperatorOption {
  id: string
  value: string
  requiresTarget: boolean
}

export const DEFAULT_EVALUATOR_OPERATOR_ID = "is equal to"
export type WorkflowTypedValue =
  | { type: "string"; value: string }
  | { type: "array"; value: string[] }

export const DEFAULT_EVALUATOR_OPERATOR_OPTIONS: WorkflowEvaluatorOperatorOption[] =
  [
    { id: "is equal to", value: "is equal to", requiresTarget: true },
    { id: "is not equal to", value: "is not equal to", requiresTarget: true },
    { id: "contains", value: "contains", requiresTarget: true },
    { id: "does not contain", value: "does not contain", requiresTarget: true },
    { id: "starts with", value: "starts with", requiresTarget: true },
    { id: "ends with", value: "ends with", requiresTarget: true },
    { id: "is greater than", value: "is greater than", requiresTarget: true },
    { id: "is less than", value: "is less than", requiresTarget: true },
    {
      id: "is greater or equal",
      value: "is greater or equal",
      requiresTarget: true,
    },
    { id: "is less or equal", value: "is less or equal", requiresTarget: true },
    { id: "is empty", value: "is empty", requiresTarget: false },
    { id: "is not empty", value: "is not empty", requiresTarget: false },
    { id: "is null", value: "is null", requiresTarget: false },
    { id: "is not null", value: "is not null", requiresTarget: false },
    { id: "is true", value: "is true", requiresTarget: false },
    { id: "is false", value: "is false", requiresTarget: false },
  ]

export interface EvaluatorCondition {
  id: string
  left: WorkflowTypedValue
  operator: ConditionOperator
  right?: WorkflowTypedValue
}

export type EvaluatorNodeConfig = {
  label: string
  conditions: EvaluatorCondition[]
  logicalOperator: "and" | "or"
  caseSensitive: boolean
}

export type InlineExpressionNodeConfig = {
  template: string[]
  isRoot: boolean
  repeatable: boolean
  caseSensitive: boolean
}

export type SetVariableNodeConfig = {
  variableName: string
  variableType: WorkflowVariableType
  valueExpression: string
  clear: boolean
}

export type ExtractorNodeConfig = {
  tokenNumber: number
  extractExpression: string
  variableType: WorkflowVariableType
  unlimited: boolean
}

export type ResultNodeConfig = {
  category: "true" | "false"
}

export interface NodeConfigByKind {
  evaluator: EvaluatorNodeConfig
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

export type WorkflowValidationSeverity = "error" | "warning" | "info"

export interface WorkflowValidationMessage {
  id?: string
  code?: string
  message: string
  severity?: WorkflowValidationSeverity
}

export interface WorkflowNodeValidationMessage
  extends WorkflowValidationMessage {
  nodeId: string
  fieldPath?: string
}

export interface WorkflowValidationSnapshot {
  workflowId?: string
  workflowVersion?: number
  revision?: string
  global?: WorkflowValidationMessage[]
  nodes?: WorkflowNodeValidationMessage[]
}

export interface NormalizedWorkflowValidationMessage
  extends WorkflowValidationMessage {
  key: string
  severity: WorkflowValidationSeverity
}

export interface NormalizedWorkflowNodeValidationMessage
  extends WorkflowNodeValidationMessage {
  key: string
  severity: WorkflowValidationSeverity
}

export interface NormalizedWorkflowValidation {
  workflowId?: string
  workflowVersion?: number
  revision?: string
  global: NormalizedWorkflowValidationMessage[]
  nodesById: Record<string, NormalizedWorkflowNodeValidationMessage[]>
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

export interface BackendWorkflowDTO {
  id: string
  name: string
  version: number
  metadata: JsonObject
  nodes: BackendWorkflowNodeDTO[]
}

export interface BackendRegularWorkflowNodeDTO {
  id: number
  kind: Exclude<NodeKind, "evaluator">
  position: XYPosition
  label: string
  config: JsonObject
  next: number[]
}

export interface BackendEvaluatorWorkflowNodeDTO {
  id: number
  kind: "evaluator"
  position: XYPosition
  label: string
  config: JsonObject
  next_true: number | null
  next_false: number | null
}

export type BackendWorkflowNodeDTO =
  | BackendRegularWorkflowNodeDTO
  | BackendEvaluatorWorkflowNodeDTO
