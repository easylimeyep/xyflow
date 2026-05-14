import { InfinityIcon } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"
import type { WorkflowVariableType } from "../../../types"

export const WORKFLOW_VARIABLE_TYPES = [
  "string",
  "array",
] satisfies WorkflowVariableType[]

export const extractor = defineNode({
  kind: "extractor" as const,
  title: "Extractor",
  description: "Extract data from the input.",
  icon: InfinityIcon,
  category: "data",
  fields: [
    {
      key: "tokenNumber",
      label: "Token Number",
      type: "number",
    },
    {
      key: "extractExpression",
      label: "Label",
      type: "text",
      placeholder: "myVar",
    },
    {
      key: "variableType",
      label: "Type",
      type: "select",
      options: WORKFLOW_VARIABLE_TYPES.map((value) => ({
        label: value,
        value,
      })),
    },
    {
      key: "unlimited",
      label: "Unlimited",
      type: "boolean",
    },
  ],
  outputPaths: [],
  allowedTargets: [
    "evaluator",
    "setVariable",
    "inlineExpression",
    "extractor",
    "result",
  ],
  buildDefaultConfig: () => ({
    tokenNumber: 0,
    extractExpression: "",
    variableType: "string" as WorkflowVariableType,
    unlimited: false,
  }),
  renameConfigKey: "extractExpression",
  validateConfigValue: (key, value) => {
    switch (key) {
      case "tokenNumber":
        return typeof value === "number"
      case "extractExpression":
        return typeof value === "string"
      case "variableType":
        return value === "string" || value === "array"
      case "unlimited":
        return typeof value === "boolean"
      default:
        return false
    }
  },
})
