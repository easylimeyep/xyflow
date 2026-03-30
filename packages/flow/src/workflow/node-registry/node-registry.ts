import type { XYPosition } from "@xyflow/react"
import type { LucideIcon } from "lucide-react"
import {
  Braces,
  Code2,
  FileInput,
  GitBranch,
  Play,
  WandSparkles,
} from "lucide-react"

import type {
  JsonObject,
  NodeConfig,
  NodeConfigByKind,
  NodeFieldSchema,
  NodeKind,
  WorkflowNode,
  WorkflowNodeData,
} from "../types/types"

export interface NodeDefinition<K extends NodeKind> {
  kind: K
  title: string
  description: string
  icon: LucideIcon
  fields: NodeFieldSchema[]
  outputPaths: string[]
  allowedTargets: NodeKind[]
  buildDefaultConfig: () => NodeConfig<K>
}

const nodeDefinitions: {
  [K in NodeKind]: NodeDefinition<K>
} = {
  trigger: {
    kind: "trigger",
    title: "Trigger",
    description: "Start node that kicks off a workflow.",
    icon: Play,
    fields: [
      {
        key: "eventName",
        label: "Event name",
        type: "text",
        ui: "expression",
        placeholder: "config-file-uploaded",
      },
    ],
    outputPaths: ["eventName"],
    allowedTargets: [
      "transform",
      "branch",
      "code",
      "customInput",
      "setVariable",
      "inlineExpression",
    ],
    buildDefaultConfig: () => ({
      eventName: "config-file-uploaded",
    }),
  },
  branch: {
    kind: "branch",
    title: "Branch",
    description: "Split the flow by condition.",
    icon: GitBranch,
    fields: [
      {
        key: "condition",
        label: "Condition",
        type: "textarea",
        ui: "expression",
        placeholder: "node.inputText contains 'access-list'",
      },
    ],
    outputPaths: ["conditionMatched"],
    allowedTargets: ["transform", "code", "customInput", "branch", "setVariable", "inlineExpression"],
    buildDefaultConfig: () => ({
      condition: "true",
    }),
  },
  transform: {
    kind: "transform",
    title: "Transform",
    description: "Map and normalize parsed values.",
    icon: WandSparkles,
    fields: [
      {
        key: "expression",
        label: "Expression",
        type: "textarea",
        ui: "expression",
        placeholder: "return { host: input.hostname?.toLowerCase() }",
      },
    ],
    outputPaths: ["result"],
    allowedTargets: [
      "transform",
      "branch",
      "code",
      "customInput",
      "setVariable",
      "inlineExpression",
    ],
    buildDefaultConfig: () => ({
      expression: "return input",
    }),
  },
  code: {
    kind: "code",
    title: "Code",
    description: "Run custom logic in a node.",
    icon: Code2,
    fields: [
      {
        key: "runtime",
        label: "Runtime",
        type: "select",
        options: [{ label: "JavaScript", value: "js" }],
      },
      {
        key: "code",
        label: "Code",
        type: "textarea",
        ui: "expression",
        placeholder: "return { ok: true }",
      },
    ],
    outputPaths: ["result"],
    allowedTargets: ["transform", "branch", "customInput", "setVariable", "inlineExpression"],
    buildDefaultConfig: () => ({
      runtime: "js",
      code: "return { ok: true }",
    }),
  },
  customInput: {
    kind: "customInput",
    title: "Custom Input",
    description: "Node with configurable user inputs.",
    icon: FileInput,
    fields: [
      {
        key: "inputKind",
        label: "Input kind",
        type: "select",
        options: [
          { label: "Config", value: "config" },
          { label: "Policy", value: "policy" },
          { label: "Metadata", value: "metadata" },
        ],
      },
      {
        key: "inputText",
        label: "Input text",
        type: "text",
        ui: "expression",
        placeholder: "interface GigabitEthernet0/1",
      },
      {
        key: "retryCount",
        label: "Retry count",
        type: "number",
      },
      {
        key: "required",
        label: "Required",
        type: "boolean",
      },
    ],
    outputPaths: ["inputText", "inputKind", "retryCount", "required"],
    allowedTargets: ["transform", "branch", "code", "setVariable", "inlineExpression"],
    buildDefaultConfig: () => ({
      inputKind: "config",
      inputText: "",
      retryCount: 0,
      required: false,
    }),
  },
  setVariable: {
    kind: "setVariable",
    title: "Set Variable",
    description: "Create reusable variable value for downstream nodes.",
    icon: Braces,
    fields: [],
    outputPaths: [],
    allowedTargets: ["transform", "branch", "code", "customInput", "setVariable", "inlineExpression"],
    buildDefaultConfig: () => ({
      variableName: "myVar",
      valueExpression: "{{ $input.item.json }}",
    }),
  },
  inlineExpression: {
    kind: "inlineExpression",
    title: "Inline Expression",
    description: "Edit expression template directly on the node.",
    icon: Braces,
    fields: [
      {
        key: "template",
        label: "Template",
        type: "text",
        ui: "expression",
        placeholder: '{{ $input.item.json.value || "fallback" }}',
      },
    ],
    outputPaths: ["template"],
    allowedTargets: ["transform", "branch", "code", "customInput", "setVariable", "inlineExpression"],
    buildDefaultConfig: () => ({
      template: "{{ $input.item.json }}",
    }),
  },
}

export const workflowNodeRegistry = nodeDefinitions

export const DEFAULT_NODE_WIDTH = 260

export function createNodeId(kind: NodeKind): string {
  return `${kind}-${crypto.randomUUID()}`
}

function toNodeData<K extends NodeKind>(kind: K, label?: string): WorkflowNodeData {
  const definition = workflowNodeRegistry[kind]
  if (!definition) {
    throw new Error(`Unknown node kind: ${kind}`)
  }

  return {
    kind,
    label: label ?? definition.title,
    config: definition.buildDefaultConfig(),
  }
}

export function createWorkflowNode<K extends NodeKind>(
  kind: K,
  position: XYPosition,
  label?: string
): WorkflowNode {
  return {
    id: createNodeId(kind),
    type: kind,
    position,
    width: DEFAULT_NODE_WIDTH,
    data: toNodeData(kind, label),
  }
}

export function normalizeNodeConfig<K extends NodeKind>(
  kind: K,
  partialConfig: Partial<NodeConfigByKind[K]>
): NodeConfigByKind[K] {
  const definition = workflowNodeRegistry[kind]
  if (!definition) {
    throw new Error(`Unknown node kind: ${kind}`)
  }
  const baseConfig = definition.buildDefaultConfig()

  const result = { ...baseConfig } as Record<string, unknown>
  const rawConfig = partialConfig as Record<string, unknown>
  definition.fields.forEach((field) => {
    const rawValue = rawConfig[field.key]
    if (rawValue === undefined) {
      return
    }

    result[field.key] = coerceFieldValue(field.type, rawValue, result[field.key])
  })

  return result as NodeConfigByKind[K]
}

function coerceFieldValue(
  fieldType: NodeFieldSchema["type"],
  rawValue: unknown,
  fallback: unknown
): unknown {
  if (fieldType === "number") {
    return typeof rawValue === "number" && Number.isFinite(rawValue) ? rawValue : fallback
  }

  if (fieldType === "boolean") {
    return typeof rawValue === "boolean" ? rawValue : fallback
  }

  if (fieldType === "select") {
    return typeof rawValue === "string" ? rawValue : fallback
  }

  return typeof rawValue === "string" ? rawValue : fallback
}

export function isRecordJsonObject(input: unknown): input is JsonObject {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false
  }

  return true
}
