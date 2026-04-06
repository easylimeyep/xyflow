## Why

The workflow editor lacks a terminal node for categorizing or labeling outcomes. Adding a `Result` node gives users a way to explicitly mark the final category of a workflow path (e.g., `true` / `false`), making flow intent clearer and enabling downstream consumers to act on a typed result.

## What Changes

- Add a new `Result` node type to the node registry under the `io` category
- The node renders a `Category` select field with options `true` and `false`
- The node has one input handle (receives a value to classify) and no output handles — it is a terminal node
- Add the node to the `NodePalette` so users can drag it onto the canvas

## Capabilities

### New Capabilities

- `result-node`: A terminal workflow node with a `Category` select (values: `true`, `false`) that represents the final classified outcome of a workflow path

### Modified Capabilities

<!-- No existing spec-level behavior changes -->

## Impact

- `packages/flow/src/workflow/nodes/io/` — new node implementation files
- `packages/flow/src/workflow/node-registry/` — register the new node type
- `packages/flow/src/styles/components/nodes/` — styles for the new node
- No breaking changes; purely additive
