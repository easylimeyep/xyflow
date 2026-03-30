import { FileInput } from "lucide-react"

import { defineNode } from "../../node-registry/define-node"
import { asNumber, asText } from "../shared"

export const customInput = defineNode({
  kind: "customInput" as const,
  title: "Custom Input",
  description: "Node with configurable user inputs.",
  icon: FileInput,
  category: "io",
  fields: [
    {
      key: "inputKind",
      label: "Input kind",
      type: "select",
      options: [
        { label: "Config", value: "config" },
        { label: "Policy", value: "policy" },
        { label: "Metadata", value: "metadata" },
      ],
    },
    {
      key: "inputText",
      label: "Input text",
      type: "text",
      ui: "expression",
      placeholder: "interface GigabitEthernet0/1",
    },
    { key: "retryCount", label: "Retry count", type: "number" },
    { key: "required", label: "Required", type: "boolean" },
  ],
  outputPaths: ["inputText", "inputKind", "retryCount", "required"],
  allowedTargets: [
    "transform",
    "branch",
    "code",
    "setVariable",
    "inlineExpression",
  ],
  buildDefaultConfig: () => ({
    inputKind: "config",
    inputText: "",
    retryCount: 0,
    required: false,
  }),
  subtitle: (config) =>
    `${asText(config.inputKind)} | retries: ${asNumber(config.retryCount)}`,
})
