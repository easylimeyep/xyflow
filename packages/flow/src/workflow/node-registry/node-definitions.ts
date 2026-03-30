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
  NodeConfig,
  NodeFieldSchema,
  NodeKind,
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
