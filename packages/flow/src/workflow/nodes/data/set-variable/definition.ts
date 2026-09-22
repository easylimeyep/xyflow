import { Braces } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"
import { isValidJsIdentifier } from "../../../expression/variable-name"
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
    "jsonEvaluator",
    "setVariable",
    "inlineExpression",
    "extractor",
    "pathExtractor",
    "result",
  ],
  buildDefaultConfig: () => ({
    variableName: "",
    variableType: "value" as WorkflowVariableType,
    valueExpression: "",
    clear: false,
  }),
  extraExpressionConfigKeys: ["valueExpression"],
  renameConfigKey: "variableName",
  variable: (node) => {
    const configured = node.config.variableName
    if (typeof configured !== "string") {
      return null
    }

    const name = configured.trim()
    if (name.length === 0 || !isValidJsIdentifier(name)) {
      return null
    }

    return {
      name,
      type: node.config.variableType === "array" ? "array" : "value",
    }
  },
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
