import { InfinityIcon } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"
import { isValidJsIdentifier } from "../../../expression/variable-name"
import {
  WORKFLOW_VARIABLE_TYPES,
  type WorkflowVariableType,
} from "../../../types/variable-types"

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
    "jsonEvaluator",
    "setVariable",
    "jsonSetter",
    "inlineExpression",
    "extractor",
    "pathExtractor",
    "result",
  ],
  buildDefaultConfig: () => ({
    tokenNumber: 1,
    extractExpression: "",
    variableType: "value" as WorkflowVariableType,
    unlimited: false,
  }),
  renameConfigKey: "extractExpression",
  // The node title stands in whenever the expression is not usable as an
  // identifier, so an author who has not yet named the extraction still gets a
  // referenceable variable.
  variable: (node) => {
    const configured = node.config.extractExpression
    const fromConfig =
      typeof configured === "string" ? configured.trim() : undefined
    const name =
      fromConfig && fromConfig.length > 0 && isValidJsIdentifier(fromConfig)
        ? fromConfig
        : node.label.trim()

    if (name.length === 0) {
      return null
    }

    return {
      name,
      type: node.config.variableType === "array" ? "array" : "value",
    }
  },
  validateConfigValue: (key, value) => {
    switch (key) {
      case "tokenNumber":
        return typeof value === "number"
      case "extractExpression":
        return typeof value === "string"
      case "variableType":
        return value === "value" || value === "array"
      case "unlimited":
        return typeof value === "boolean"
      default:
        return false
    }
  },
})
