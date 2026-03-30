import { WandSparkles } from "lucide-react"

import { defineNode } from "../../node-registry/define-node"
import { asText } from "../shared"

export const transform = defineNode({
  kind: "transform" as const,
  title: "Transform",
  description: "Map and normalize parsed values.",
  icon: WandSparkles,
  category: "data",
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
  buildDefaultConfig: () => ({ expression: "return input" }),
  subtitle: (config) => asText(config.expression),
})
