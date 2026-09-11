import { Waypoints } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"
import type { FieldOption, PathExtractorOutputType } from "../../../types/types"
import { isSelectConfigValue } from "../../shared/node-data-utils"

/**
 * The `expected out` choices the node ships with, in display order. `value` is
 * the sensible default: the resolved value handed downstream as-is. A host may
 * replace the list through `runtime.nodeOptions.pathExtractor.outputType`, so
 * the component reads the active options from the store and only falls back
 * here.
 */
export const PATH_EXTRACTOR_OUTPUT_TYPE_OPTIONS = [
  { value: "string", label: "string" },
  { value: "value", label: "value" },
  { value: "arrayValue", label: "array value" },
  { value: "arrayObject", label: "array object" },
] satisfies FieldOption[]

export const pathExtractor = defineNode({
  kind: "pathExtractor" as const,
  title: "Path Extractor",
  description: "Extract a value from the input by path.",
  icon: Waypoints,
  category: "data",
  fields: [
    {
      key: "variableLabel",
      label: "Label",
      type: "text",
      placeholder: "myVar",
    },
    {
      key: "path",
      label: "Path",
      type: "text",
      placeholder: "user.address.city",
    },
    {
      key: "outputType",
      label: "Expected out",
      type: "select",
      options: [...PATH_EXTRACTOR_OUTPUT_TYPE_OPTIONS],
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
    variableLabel: "",
    path: "",
    outputType: "value" as PathExtractorOutputType,
  }),
  renameConfigKey: "variableLabel",
  validateConfigValue: (key, value) => {
    switch (key) {
      case "variableLabel":
      case "path":
        return typeof value === "string"
      case "outputType":
        return isSelectConfigValue(value)
      default:
        return false
    }
  },
})
