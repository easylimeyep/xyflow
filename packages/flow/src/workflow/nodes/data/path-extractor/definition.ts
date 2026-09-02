import { Waypoints } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"
import type { PathExtractorOutputType } from "../../../types/types"

/**
 * The `expected out` choices, in display order. `value` is the sensible
 * default: the resolved value handed downstream as-is.
 */
export const PATH_EXTRACTOR_OUTPUT_TYPE_OPTIONS = [
  { value: "string", label: "string" },
  { value: "value", label: "value" },
  { value: "arrayValue", label: "array value" },
  { value: "arrayObject", label: "array object" },
] satisfies { value: PathExtractorOutputType; label: string }[]

function isPathExtractorOutputType(
  value: unknown
): value is PathExtractorOutputType {
  return (
    value === "string" ||
    value === "value" ||
    value === "arrayValue" ||
    value === "arrayObject"
  )
}

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
      options: PATH_EXTRACTOR_OUTPUT_TYPE_OPTIONS.map(({ value, label }) => ({
        label,
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
        return isPathExtractorOutputType(value)
      default:
        return false
    }
  },
})
