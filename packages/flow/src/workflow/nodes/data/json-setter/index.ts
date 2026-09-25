import { JsonSetterNode } from "./component"
import { jsonSetter as base } from "./definition"

/**
 * The definition the package exports, with its renderer attached here rather
 * than in `definition.ts`, matching the other built-ins.
 */
export const jsonSetter = { ...base, view: JsonSetterNode }
