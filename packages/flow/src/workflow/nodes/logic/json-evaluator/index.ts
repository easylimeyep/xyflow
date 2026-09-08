import { JsonEvaluatorNode } from "./component"
import { jsonEvaluator as base } from "./definition"

/**
 * The definition the package exports, with its renderer attached here rather
 * than in `definition.ts`: the component imports the base definition for its
 * outputs, so wiring the view at the definition would cycle.
 */
export const jsonEvaluator = { ...base, view: JsonEvaluatorNode }
