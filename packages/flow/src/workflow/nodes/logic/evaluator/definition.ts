import { Scale } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"
import {
  buildDefaultEvaluatorConfig,
  evaluatorSubtitle,
  EVALUATOR_ALLOWED_TARGETS,
  EVALUATOR_OUTPUTS,
  validateEvaluatorConfigValue,
} from "../evaluator-shared/config"

export const evaluator = defineNode({
  kind: "evaluator" as const,
  title: "Evaluator",
  description: "Split the flow by condition.",
  icon: Scale,
  category: "logic",
  fields: [],
  outputPaths: [],
  allowedTargets: EVALUATOR_ALLOWED_TARGETS,
  buildDefaultConfig: buildDefaultEvaluatorConfig,
  renameConfigKey: "label",
  subtitle: evaluatorSubtitle,
  outputs: EVALUATOR_OUTPUTS,
  validateConfigValue: validateEvaluatorConfigValue,
})
