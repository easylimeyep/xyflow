import { Play } from "lucide-react"

import { defineNode } from "../../node-registry/define-node"
import { asText } from "../shared"

export const trigger = defineNode({
  kind: "trigger" as const,
  title: "Trigger",
  description: "Start node that kicks off a workflow.",
  icon: Play,
  category: "control",
  fields: [
    {
      key: "eventName",
      label: "Event name",
      type: "text",
      ui: "expression",
      placeholder: "config-file-uploaded",
    },
  ],
  outputPaths: ["eventName"],
  allowedTargets: [
    "transform",
    "branch",
    "code",
    "customInput",
    "setVariable",
    "inlineExpression",
  ],
  buildDefaultConfig: () => ({ eventName: "config-file-uploaded" }),
  showTarget: false,
  subtitle: (config) => `event: ${asText(config.eventName) || "unset"}`,
})
