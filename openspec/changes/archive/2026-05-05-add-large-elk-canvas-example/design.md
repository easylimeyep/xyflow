## Context

`ElkGraphExample` already demonstrates `createInitialGraphElk`, but it only has a short five-node workflow. The new example should stress the same public builder and layout path with a larger graph while staying easy to understand from the demo source.

## Goals / Non-Goals

**Goals:**
- Add a separate large ELK example with roughly 40 compact input nodes.
- Keep node positions fully computed by `createInitialGraphElk`.
- Model a workflow that begins at a root Keyword, converges many branches into one Keyword, and ends at true/false Result nodes.

**Non-Goals:**
- Change ELK options, node registry rules, validation behavior, or public builder APIs.
- Replace the existing small ELK demo.
- Add custom styling or new reusable UI primitives.

## Design

- Create a new `LargeElkGraphExample` component following the existing async loading pattern from `ElkGraphExample`.
- Define graph input with semantic node and edge data only: ids, kinds, labels, partial configs, and handles where needed.
- Use a graph shape with:
  - one root `inlineExpression` node labeled `Keyword Root`;
  - ten extraction/check lanes from the root;
  - a convergence `inlineExpression` node labeled for review/aggregation with ten incoming edges;
  - additional downstream enrichment and decision nodes to bring the graph to about 40 nodes;
  - a final branch that routes `branch-true` to a `result` node with category `true` and `branch-false` to a `result` node with category `false`.
- Add a new tab in `apps/web/app/page.tsx` and render the new example there.

## Risks / Trade-offs

- A 40-node example can make the inline code preview long. Keep the preview representative and readable, but prefer showing the actual builder pattern over hiding the important graph structure.
- Multiple incoming edges are allowed by current validation as long as exact duplicate source/target/handle tuples are avoided, so the convergence node should receive edges from distinct upstream nodes.
