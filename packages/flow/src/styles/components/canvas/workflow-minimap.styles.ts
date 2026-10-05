import { tv } from "tailwind-variants"

/**
 * Keeps React Flow's mini map class names where its theme variables apply,
 * so the `--xy-minimap-*` variables and the container rules in `style.css`
 * work unchanged.
 */
export const workflowMiniMapStyles = tv({
  slots: {
    root: "react-flow__minimap",
    // Clips the viewport frame's shadow to the mini map box.
    surface: "relative overflow-hidden",
    // Its own compositing layer: panning only transforms it, never repaints.
    nodesLayer: "absolute inset-0 origin-top-left will-change-transform",
    svg: "react-flow__minimap-svg",
    // Beneath the nodes and see-through, so the nodes a group holds stay
    // visible on top of it. The stroke stays one pixel at any graph size.
    frames:
      "fill-muted-foreground/10 stroke-muted-foreground/40 [stroke-width:1] [vector-effect:non-scaling-stroke]",
    nodes: "react-flow__minimap-node",
    // The visible area: a primary border, and a shadow wide enough to dim
    // the rest of the box wherever the frame sits.
    viewport: [
      "pointer-events-none absolute top-0 left-0 box-border origin-top-left will-change-transform",
      "border-2 border-primary",
      "shadow-[0_0_0_400px_var(--xy-minimap-mask-background-color,var(--xy-minimap-mask-background-color-default))]",
    ],
  },
})
