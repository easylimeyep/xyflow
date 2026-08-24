## 1. Overlay Types and Context

- [x] 1.1 Add `NodeRuntimeStatus`, `NodeRuntimeState`, and `WorkflowRuntimeOverlay` to `workflow/types/types.ts` and export them from the package entry point.
- [x] 1.2 Add a runtime-overlay React context in `workflow/runtime/` exposing a per-node read so a status change for one node does not re-render every other node.
- [x] 1.3 Add unit tests covering a partial overlay: nodes absent from `overlay.nodes` resolve to no runtime state.

## 2. Canvas Mode Gating

- [x] 2.1 Add `mode?: "edit" | "observe"` to the canvas props, defaulting to `"edit"` so existing behaviour is unchanged.
- [x] 2.2 In `observe` mode disable `nodesDraggable`, `nodesConnectable`, and edge selection while keeping pan, zoom, and node selection enabled.
- [x] 2.3 Hide mutating entries (delete, duplicate, add) from the node context menu in `observe` mode.
- [x] 2.4 Add canvas tests asserting drag, connect, and delete produce no store mutation in `observe` mode and still work in `edit` mode.

## 3. Node Status Rendering

- [x] 3.1 Add status variants to `styles/components/nodes/node-shell.styles.ts` for the five statuses using `tv` slots, without introducing `cn`.
- [x] 3.2 Render the status treatment in `NodeShell` from the overlay context so every registered node kind inherits it.
- [x] 3.3 Render the iteration counter (`2 / 3`) on nodes whose runtime state carries `iteration`.
- [x] 3.4 Render the `error` string on nodes with status `failed`, truncated to a single line with the full text in a tooltip.
- [x] 3.5 Add `NodeShell` tests covering each of the five statuses, the iteration counter, and the neutral appearance when no runtime state is present.

## 4. Edge Traversal Styling

- [x] 4.1 Add traversal variants to `styles/components/canvas/workflow-edge.styles.ts` for traversed, active, and untouched edges.
- [x] 4.2 Apply the variants in `WorkflowEdge` from `traversedEdgeIds` and `activeEdgeIds`, allowing an edge to be both traversed and active.
- [x] 4.3 Add edge tests covering the three states and the traversed-and-active combination.

## 5. Node Inspector

- [x] 5.1 Add a read-only inspector view that renders the selected node's `input`, `output`, and `error` as collapsed JSON with a size cap.
- [x] 5.2 Route `NodeConfigPanel` to the inspector in `observe` mode and to the existing config form in `edit` mode.
- [x] 5.3 Add tests asserting no config field is editable in `observe` mode and that the inspector renders nothing when the selected node has no runtime state.

## 6. Editor Composition and Docs

- [x] 6.1 Thread `mode` and `overlay` through `WorkflowEditor` to the canvas and the panel, keeping both optional.
- [x] 6.2 Add a Storybook story showing a workflow mid-run: mixed statuses, one loop counter, one failed node, one skipped branch.
- [x] 6.3 Add a Playwright smoke spec asserting the graph is byte-identical after attempting drag, delete, and connect in `observe` mode.
- [x] 6.4 Document the observation mode and overlay shape in the package README, stating that status computation is the consumer's responsibility.

## 7. Verification

- [x] 7.1 Run `pnpm --filter @flow/flow test` and `pnpm typecheck` and confirm both are green.
- [x] 7.2 Run `pnpm --filter web test:e2e:smoke` and confirm existing editing specs are unaffected.
- [x] 7.3 Run `pnpm lint` and `pnpm format` and confirm no `cn` import was introduced into `packages/flow`.
