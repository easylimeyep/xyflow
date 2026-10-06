import { tv } from "tailwind-variants"

/**
 * Marks an interactive control inside a node — an input, an expression
 * editor, a select trigger, a checkbox, a button — so that pressing it edits
 * or acts instead of dragging the node (`nodrag`) or panning the canvas
 * (`nopan`). Everything else in a node body drags the node, so put this on the
 * control itself, never on a block that also holds labels or spacing: React
 * Flow skips the drag for anything inside a `nodrag` element.
 */
export const nodeControlStyles = tv({
  base: "nodrag nopan",
})
