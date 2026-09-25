import type { NodeVariableReader } from "../../../node-registry/define-node"
import { isValidJsIdentifier } from "../../../expression/variable-name"
import {
  WORKFLOW_VARIABLE_TYPES,
  type WorkflowVariableType,
} from "../../../types/variable-types"

/** The kinds a Setter-family node may connect to. */
export const SETTER_ALLOWED_TARGETS = [
  "evaluator",
  "jsonEvaluator",
  "setVariable",
  "jsonSetter",
  "inlineExpression",
  "extractor",
  "pathExtractor",
  "result",
]

export const SETTER_VARIABLE_TYPE_OPTIONS = WORKFLOW_VARIABLE_TYPES.map(
  (value) => ({ label: value, value })
)

export const buildDefaultSetterConfig = () => ({
  variableName: "",
  variableType: "value" as WorkflowVariableType,
  valueExpression: "",
  clear: false,
})

export const setterVariable: NodeVariableReader = (node) => {
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
}

/**
 * Validates the config keys every Setter-family node shares. Unknown keys are
 * rejected, so a sibling that adds its own keys checks them before delegating.
 */
export function validateSetterConfigValue(key: string, value: unknown) {
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
}
