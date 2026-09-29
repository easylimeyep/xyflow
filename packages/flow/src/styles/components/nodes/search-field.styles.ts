import { tv } from "tailwind-variants"

/**
 * The canvas-search mark on one field of a node: the title, a variable-name
 * input, an expression input or an operand control.
 *
 * Kept deliberately distinct from the node-level marks: fields read the same
 * amber for "a match is here", while the one strong primary ring on the canvas
 * always sits on the field the search is on.
 */
export const searchFieldStyles = tv({
  base: "min-w-0 rounded-md transition-shadow",
  variants: {
    searchState: {
      none: "",
      match: "bg-amber-400/10 ring-1 ring-amber-400/70",
      current: "bg-primary/5 ring-2 ring-primary",
    },
  },
  defaultVariants: {
    searchState: "none",
  },
})
