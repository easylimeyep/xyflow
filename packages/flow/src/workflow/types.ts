import type { Edge, Node, Viewport, XYPosition } from "@xyflow/react"

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonArray
export type JsonObject = { [key: string]: JsonValue }
export type JsonArray = JsonValue[]

export type NodeKind =
  | "trigger"
  | "branch"
  | "transform"
  | "code"
  | "customInput"
  | "setVariable"
  | "inlineExpression"

export const WORKFLOW_NODE_KINDS: NodeKind[] = [
  "trigger",
  "branch",
  "transform",
  "code",
  "customInput",
  "setVariable",
  "inlineExpression",
]

export function isNodeKind(value: unknown): value is NodeKind {
  return typeof value === "string" && WORKFLOW_NODE_KINDS.includes(value as NodeKind)
}

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

export type TriggerNodeConfig = {
  eventName: string
}

export type BranchNodeConfig = {
  condition: string
}

export type TransformNodeConfig = {
  expression: string
}

export type CodeNodeConfig = {
  code: string
  runtime: "js"
}

export type CustomInputNodeConfig = {
  inputText: string
  retryCount: number
  required: boolean
  inputKind: "config" | "policy" | "metadata"
}

export type InlineExpressionNodeConfig = {
  template: string
}

export type SetVariableNodeConfig = {
  variableName: string
  valueExpression: string
}

export interface NodeConfigByKind {
  trigger: TriggerNodeConfig
  branch: BranchNodeConfig
  transform: TransformNodeConfig
  code: CodeNodeConfig
  customInput: CustomInputNodeConfig
  setVariable: SetVariableNodeConfig
  inlineExpression: InlineExpressionNodeConfig
}

export type NodeConfig<K extends NodeKind> = NodeConfigByKind[K]

export interface BaseWorkflowNodeData<K extends NodeKind> {
  [key: string]: unknown
  kind: K
  label: string
  config: JsonObject
}

export type WorkflowNodeData = BaseWorkflowNodeData<NodeKind>

export type WorkflowNode = Node<WorkflowNodeData>

export interface WorkflowEdgeData {
  [key: string]: unknown
  sourceKind: NodeKind
  targetKind: NodeKind
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
  kind: NodeKind
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
