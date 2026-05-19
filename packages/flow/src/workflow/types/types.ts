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

export type WorkflowEvaluatorOperatorAllowType = WorkflowVariableType | "none"

export interface WorkflowEvaluatorOperatorOption {
  id: string
  value: string
  allowTypes: WorkflowEvaluatorOperatorAllowType[]
}

export interface WorkflowEvaluatorOperatorCatalog {
  value: WorkflowEvaluatorOperatorOption[]
  array: WorkflowEvaluatorOperatorOption[]
}

export const DEFAULT_EVALUATOR_OPERATOR_ID = "is equal to"
export type WorkflowTypedValue =
  | { type: "value"; value: string }
  | { type: "array"; value: string[] }

export const DEFAULT_EVALUATOR_OPERATOR_OPTIONS: WorkflowEvaluatorOperatorCatalog =
  {
    value: [
      { id: "is equal to", value: "is equal to", allowTypes: ["value"] },
      {
        id: "is not equal to",
        value: "is not equal to",
        allowTypes: ["value"],
      },
      { id: "contains", value: "contains", allowTypes: ["value"] },
      {
        id: "does not contain",
        value: "does not contain",
        allowTypes: ["value"],
      },
      { id: "starts with", value: "starts with", allowTypes: ["value"] },
      { id: "ends with", value: "ends with", allowTypes: ["value"] },
      {
        id: "is greater than",
        value: "is greater than",
        allowTypes: ["value"],
      },
      { id: "is less than", value: "is less than", allowTypes: ["value"] },
      {
        id: "is greater or equal",
        value: "is greater or equal",
        allowTypes: ["value"],
      },
      {
        id: "is less or equal",
        value: "is less or equal",
        allowTypes: ["value"],
      },
      { id: "is empty", value: "is empty", allowTypes: ["none"] },
      { id: "is not empty", value: "is not empty", allowTypes: ["none"] },
      { id: "is null", value: "is null", allowTypes: ["none"] },
      { id: "is not null", value: "is not null", allowTypes: ["none"] },
      { id: "is true", value: "is true", allowTypes: ["none"] },
      { id: "is false", value: "is false", allowTypes: ["none"] },
    ],
    array: [
      { id: "is equal to", value: "is equal to", allowTypes: ["array"] },
      {
        id: "is not equal to",
        value: "is not equal to",
        allowTypes: ["array"],
      },
      { id: "contains", value: "contains", allowTypes: ["value"] },
      {
        id: "does not contain",
        value: "does not contain",
        allowTypes: ["value"],
      },
      { id: "is empty", value: "is empty", allowTypes: ["none"] },
      { id: "is not empty", value: "is not empty", allowTypes: ["none"] },
      { id: "is null", value: "is null", allowTypes: ["none"] },
      { id: "is not null", value: "is not null", allowTypes: ["none"] },
    ],
  }

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

export interface WorkflowNodeValidationMessage extends WorkflowValidationMessage {
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

export interface NormalizedWorkflowValidationMessage extends WorkflowValidationMessage {
  key: string
  severity: WorkflowValidationSeverity
}

export interface NormalizedWorkflowNodeValidationMessage extends WorkflowNodeValidationMessage {
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
