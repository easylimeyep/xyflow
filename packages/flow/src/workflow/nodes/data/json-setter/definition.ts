import { FileJson } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"
import {
  SETTER_ALLOWED_TARGETS,
  SETTER_VARIABLE_TYPE_OPTIONS,
  buildDefaultSetterConfig,
  setterVariable,
  validateSetterConfigValue,
} from "../setter-shared/config"

/**
 * The Setter's JSON sibling. Same config and variable behaviour, plus
 * `appendInput`: a flag the editor only stores and exports — the backend
 * decides what appending the node's input means.
 */
export const jsonSetter = defineNode({
  kind: "jsonSetter" as const,
  title: "JSON Setter",
  description:
    "Create reusable variable value, optionally appending the node input.",
  icon: FileJson,
  category: "data",
  fields: [
    {
      key: "variableType",
      label: "Type",
      type: "select",
      options: SETTER_VARIABLE_TYPE_OPTIONS,
    },
  ],
  outputPaths: [],
  allowedTargets: SETTER_ALLOWED_TARGETS,
  buildDefaultConfig: () => ({
    ...buildDefaultSetterConfig(),
    appendInput: false,
  }),
  extraExpressionConfigKeys: ["valueExpression"],
  renameConfigKey: "variableName",
  variable: setterVariable,
  validateConfigValue: (key, value) =>
    key === "appendInput"
      ? typeof value === "boolean"
      : validateSetterConfigValue(key, value),
})
