import { Code2 } from "lucide-react"

import { defineNode } from "../../node-registry/define-node"
import { asText } from "../shared"

export const code = defineNode({
  kind: "code" as const,
  title: "Code",
  description: "Run custom logic in a node.",
  icon: Code2,
  category: "data",
  fields: [
    {
      key: "runtime",
      label: "Runtime",
      type: "select",
      options: [{ label: "JavaScript", value: "js" }],
    },
    {
      key: "code",
      label: "Code",
      type: "textarea",
      ui: "expression",
      placeholder: "return { ok: true }",
    },
  ],
  outputPaths: ["result"],
  allowedTargets: [
    "transform",
    "branch",
    "customInput",
    "setVariable",
    "inlineExpression",
  ],
  buildDefaultConfig: () => ({ runtime: "js", code: "return { ok: true }" }),
  subtitle: (config) =>
    `${asText(config.runtime) || "js"}: ${asText(config.code).slice(0, 40)}`,
})
