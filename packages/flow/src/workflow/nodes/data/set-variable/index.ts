import { SetVariableNode } from "./component"
import { setVariable as base } from "./definition"

/**
 * The definition the package exports, with its renderer attached here rather
 * than in `definition.ts`: the component imports the base definition for its
 * fields, so wiring the view at the definition would cycle.
 */
export const setVariable = { ...base, view: SetVariableNode }
