import { Braces } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"
import {
  SETTER_ALLOWED_TARGETS,
  SETTER_VARIABLE_TYPE_OPTIONS,
  buildDefaultSetterConfig,
  setterVariable,
  validateSetterConfigValue,
} from "../setter-shared/config"

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
      options: SETTER_VARIABLE_TYPE_OPTIONS,
    },
  ],
  outputPaths: [],
  allowedTargets: SETTER_ALLOWED_TARGETS,
  buildDefaultConfig: buildDefaultSetterConfig,
  extraExpressionConfigKeys: ["valueExpression"],
  renameConfigKey: "variableName",
  variable: setterVariable,
  validateConfigValue: validateSetterConfigValue,
})
