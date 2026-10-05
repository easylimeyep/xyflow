import { DEFAULT_NODE_HEIGHT } from "../node-registry/node-factory"
import type { WorkflowNode } from "../types/types"

// Heights of the built-in views as measured in the browser, for their smallest
// content: one expression line, one template row, one condition. Keep them in
// step with the views; `node-size-estimate.test.ts` lists the measurements.
const EXTRACTOR_HEIGHT = 195
const PATH_EXTRACTOR_HEIGHT = 142
const RESULT_HEIGHT = 93
const SET_VARIABLE_HEIGHT = 201
const JSON_SETTER_HEIGHT = 257
const INLINE_EXPRESSION_HEIGHT = 178
const EVALUATOR_BASE_HEIGHT = 159
const EVALUATOR_CONDITION_HEIGHT = 56
/** The JSON Evaluator's extra match-type select. */
const JSON_EVALUATOR_MATCH_TYPE_HEIGHT = 53

/** One more line in an expression editor. */
const EXPRESSION_LINE_HEIGHT = 16.8
/** One more row in a keyword node's template list. */
const TEMPLATE_ROW_HEIGHT = 35.3

function extraExpressionLines(value: unknown): number {
  return typeof value === "string" ? value.split("\n").length - 1 : 0
}

function extraListEntries(value: unknown): number {
  return Array.isArray(value) ? Math.max(0, value.length - 1) : 0
}

/**
 * How tall a node usually renders, for when it has not been measured yet: the
 * layout spaces nodes by it, and a compact node at low zoom keeps this box, so
 * a close guess keeps nodes from crowding once they render in full.
 */
export function getEstimatedNodeHeight(node: WorkflowNode): number {
  const { config } = node.data

  switch (node.data.kind) {
    case "extractor":
      return EXTRACTOR_HEIGHT
    case "pathExtractor":
      return PATH_EXTRACTOR_HEIGHT
    case "result":
      return RESULT_HEIGHT
    case "setVariable":
      return (
        SET_VARIABLE_HEIGHT +
        extraExpressionLines(config.valueExpression) * EXPRESSION_LINE_HEIGHT
      )
    case "jsonSetter":
      return (
        JSON_SETTER_HEIGHT +
        extraExpressionLines(config.valueExpression) * EXPRESSION_LINE_HEIGHT
      )
    case "inlineExpression":
      return (
        INLINE_EXPRESSION_HEIGHT +
        extraListEntries(config.template) * TEMPLATE_ROW_HEIGHT
      )
    case "evaluator":
    case "jsonEvaluator": {
      const conditionCount = Array.isArray(config.conditions)
        ? Math.max(1, config.conditions.length)
        : 1

      return (
        EVALUATOR_BASE_HEIGHT +
        conditionCount * EVALUATOR_CONDITION_HEIGHT +
        (node.data.kind === "jsonEvaluator"
          ? JSON_EVALUATOR_MATCH_TYPE_HEIGHT
          : 0)
      )
    }
    default:
      return DEFAULT_NODE_HEIGHT
  }
}
