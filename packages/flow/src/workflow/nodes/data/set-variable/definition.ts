import { Braces } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"
import {
  WORKFLOW_VARIABLE_TYPES,
  type WorkflowVariableType,
} from "../../../types/variable-types"

export const setVariable = defineNode({
  kind: "setVariable" as const,
  title: "Setter",
  description: "Create reusable variable value for downstream nodes.",
  icon: Braces,
  category: "data",
  fields: [
    {
      key: "variableType",
      label: "Type",
      type: "select",
      options: WORKFLOW_VARIABLE_TYPES.map((value) => ({
        label: value,
        value,
      })),
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
    variableName: "myVar",
    variableType: "value" as WorkflowVariableType,
    valueExpression: "",
    clear: false,
  }),
  extraExpressionConfigKeys: ["valueExpression"],
  renameConfigKey: "variableName",
  validateConfigValue: (key, value) => {
    switch (key) {
      case "variableName":
      case "valueExpression":
        return typeof value === "string"
      case "variableType":
        return value === "value" || value === "array"
      case "clear":
        return typeof value === "boolean"
      default:
        return false
    }
  },
})
