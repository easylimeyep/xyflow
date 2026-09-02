import { PathExtractorNode } from "./component"
import { pathExtractor as base } from "./definition"

/**
 * The definition the package exports, with its renderer attached here rather
 * than in `definition.ts`: the component imports the base definition for its
 * output-type options, so wiring the view at the definition would cycle.
 */
export const pathExtractor = { ...base, view: PathExtractorNode }
