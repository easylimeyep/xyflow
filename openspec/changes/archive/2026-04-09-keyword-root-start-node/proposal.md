## Why

Workflow authors currently need a dedicated `Trigger` node to start execution, even when the first meaningful step is a `Keyword` node. This adds extra visual noise and makes simple flows harder to read. Introducing a `Root` mode directly on `Keyword` simplifies graph authoring and enables multiple explicit start points.

## What Changes

- Add a `Root` checkbox to the `Keyword` node card header, rendered next to the node title.
- Store `Root` state on `Keyword` (`inlineExpression`) as a boolean config flag.
- When `Root` is enabled, the `Keyword` node behaves as a start node by hiding its input handle.
- Prevent incoming connections to `Keyword` nodes with `Root` enabled.
- When `Root` is enabled on a node that already has incoming edges, remove those incoming edges automatically.
- Allow multiple `Keyword` nodes to be marked as `Root` in the same workflow.
- Remove the `Trigger` node from node registry, palette, and default graph initialization.
- **BREAKING**: Do not provide migration for legacy workflows that still contain `trigger` nodes.

## Capabilities

### New Capabilities
- `keyword-root-start-node`: Make `Keyword` nodes optionally act as workflow start nodes via a `Root` toggle, and remove dedicated `Trigger` node authoring.

### Modified Capabilities
<!-- No existing spec-level behavior changes -->

## Impact

- `packages/flow/src/workflow/nodes/data/inline-expression/*` - add `Root` authoring behavior.
- `packages/flow/src/workflow/nodes/node-shell/*` and node styles - header layout update for title + checkbox.
- `packages/flow/src/workflow/validation/*` and store graph updates - enforce no incoming edges for root keywords and prune existing incoming edges on toggle.
- `packages/flow/src/workflow/node-registry/*`, `default-graph/*`, and workflow types - remove `trigger` kind and start from `Keyword` root node.
- Tests in `packages/flow/src/workflow/**` - replace trigger-centric fixtures and add root semantics coverage.
