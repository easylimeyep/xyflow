## 1. Fix Module-Level Selector Cache (store-expression-cache)

- [x] 1.1 Add `expressionCatalogCache: Map<string, ExpressionVariableOption[]>` to `WorkflowStoreQueries` in `packages/flow/src/workflow/store/types.ts`
- [x] 1.2 In `packages/flow/src/workflow/store/expression-deps.ts`, add `expressionCatalogCache: new Map()` to `buildExpressionSliceState` return value
- [x] 1.3 In `buildExpressionSlicePatch` (expression-deps.ts), emit `expressionCatalogCache: new Map()` alongside the new signature when the signature changes
- [x] 1.4 Remove the two module-level variable declarations from `packages/flow/src/workflow/store/selectors.ts` (lines 58-59)
- [x] 1.5 Rewrite `selectExpressionVariablesForNode` to read from `state.expressionCatalogCache`; fall back to inline computation on cache miss (no write-back — selectors are read-only)
- [x] 1.6 Run `vitest run packages/flow` and confirm all tests pass, including the expression catalog selector stability test

## 2. Decouple Graph Slices from Expression Domain

- [x] 2.1 Create `packages/flow/src/workflow/store/graph-refactors.ts` that re-exports `refactorNodeReferencesInGraph` and `refactorVariableReferencesInGraph` from `../../expression/refactor/refactor`
- [x] 2.2 Update import in `packages/flow/src/workflow/store/slices/graph-slice.ts` to import from `../graph-refactors` instead of `../../expression/refactor/refactor`
- [x] 2.3 Update imports in `packages/flow/src/workflow/store/slices/io-slice.ts` similarly
- [x] 2.4 Update import in `packages/flow/src/workflow/store/node-config-updates.ts` similarly
- [x] 2.5 Run `vitest run packages/flow` to confirm no regressions

## 3. Eliminate Code Duplication in Utilities

- [x] 3.1 In `packages/flow/src/workflow/store/naming.ts`, extract a private `createUniqueIdentifier(base, used, { fallback, separator })` helper; rewrite `createUniqueLabel` and `createUniqueJsIdentifier` as thin wrappers around it
- [x] 3.2 In `packages/flow/src/workflow/store/slices/history-slice.ts`, extract a private `applyHistoryNavigation(state, historyFn)` function; rewrite `undo` and `redo` to call it
- [x] 3.3 In `packages/flow/src/workflow/store/slices/selection-slice.ts`, extract a private `applySelection(state, nextSelectedNodeIds)` function; rewrite `setSelectedNodes` and `setSelectedNode` to call it
- [x] 3.4 Add `deduplicateNodeLabels(nodes, existingLabels)` helper to `naming.ts` (returns `{ nodes, renames }`)
- [x] 3.5 Use `deduplicateNodeLabels` in `io-slice.ts` inside both `pasteFromClipboard` and `importFromJson` to replace the duplicated label uniqueness loops
- [x] 3.6 Run `vitest run packages/flow` to confirm all tests pass

## 4. Add Named Constants for Geometry

- [x] 4.1 Add `export const DEFAULT_NODE_HEIGHT = 80` to `packages/flow/src/workflow/node-registry/node-factory.ts`
- [x] 4.2 Create `packages/flow/src/workflow/store/geometry-constants.ts` with named exports for all magic values: `QUICK_ADD_HORIZONTAL_GAP`, `DEFAULT_NODE_COLLISION_MARGIN`, `EDGE_INSERT_VERTICAL_HALF_HEIGHT`, `BRANCH_TRUE_HANDLE_OFFSET_RATIO`, `BRANCH_FALSE_HANDLE_OFFSET_RATIO`, `QUICK_ADD_CANDIDATE_OFFSETS`, `SUBGRAPH_SHIFT_MARGIN`
- [x] 4.3 Replace all numeric literals in `packages/flow/src/workflow/store/geometry.ts` with the named constants; import `DEFAULT_NODE_HEIGHT` from `node-factory`
- [x] 4.4 Run `vitest run packages/flow` to confirm no regressions

## 5. Extensible NodeDefinition Config Fields (store-extensible-node-config)

- [x] 5.1 Add optional `extraExpressionConfigKeys?: string[]` and `renameConfigKey?: string` to `NodeDefinition` in `packages/flow/src/workflow/node-registry/define-node.ts`
- [x] 5.2 In `packages/flow/src/workflow/nodes/data/set-variable/definition.ts`, add `extraExpressionConfigKeys: ["valueExpression"]` and `renameConfigKey: "variableName"`
- [x] 5.3 In `packages/flow/src/workflow/expression/refactor/refactor.ts`, replace the hardcoded `if (kind === "setVariable")` block in `getExpressionConfigKeys` with `[...fieldKeys, ...(definition.extraExpressionConfigKeys ?? [])]`
- [x] 5.4 In `packages/flow/src/workflow/store/node-config-updates.ts`, replace the hardcoded `if (update.kind === "setVariable" && update.key === "variableName")` with a lookup of `def.renameConfigKey`; rename `applySetVariableRename` to `applyRenameableFieldUpdate`
- [x] 5.5 Run `vitest run packages/flow` — variable rename and expression config key tests must pass

## 6. Decompose graph-slice: Extract onNodesChange Helpers (store-slice-decomposition)

- [x] 6.1 In `packages/flow/src/workflow/store/slices/graph-slice.ts`, extract a private `computeNextGraphFromNodeChanges(currentGraph, changes)` function returning `{ nextGraph, removedNodeIds, nodeCollectionChanged, edgeCollectionChanged, nextSelectedNodeIds, selectionChanged }`
- [x] 6.2 Extract a private `classifyNodeChanges(changes)` function returning `{ shouldCommit, isPositionOnly, hasDraggingChanges }`
- [x] 6.3 Rewrite `onNodesChange` to delegate to these helpers; body must not exceed 40 lines
- [x] 6.4 Run `vitest run packages/flow` — drag, undo, and selection sync tests must pass

## 7. Decompose graph-slice: Split into Sub-Slices (store-slice-decomposition)

- [x] 7.1 Create `packages/flow/src/workflow/store/slices/node-crud-slice.ts` containing `addNode`, `updateNodeLabel`, `updateNodeConfig`, `isSetVariableNameUnique`; move the `createNodeWithUniqueLabel` helper here
- [x] 7.2 Create `packages/flow/src/workflow/store/slices/connection-slice.ts` containing `onConnect` and `onEdgesChange`
- [x] 7.3 Update `packages/flow/src/workflow/store/slices/index.ts` to export `createNodeCrudSlice` and `createConnectionSlice`
- [x] 7.4 Update `packages/flow/src/workflow/store/store.ts` to spread the two new slices; remove their commands from `createGraphSlice`
- [x] 7.5 Run `vitest run packages/flow` — all integration tests must pass

## 8. Decompose pasteFromClipboard (store-slice-decomposition)

- [x] 8.1 In `packages/flow/src/workflow/store/slices/io-slice.ts`, extract private `buildPastedNodes(parsedNodes, anchor, existingLabels, existingVariableNames)` returning `{ nodes, labelRenames, variableRenames }`
- [x] 8.2 Extract private `buildPastedEdges(connections, nodeIdMap, nodeById, existingEdges)` returning `WorkflowEdge[]`
- [x] 8.3 Rewrite `pasteFromClipboard` to orchestrate these helpers; body must not exceed 40 lines
- [x] 8.4 Run `vitest run packages/flow` — clipboard copy/paste tests must pass

## 9. Fix Component Store Subscriptions

- [x] 9.1 In `packages/flow/src/workflow/nodes/output-quick-add-affordance/output-quick-add-affordance.tsx`, consolidate the three `useWorkflowStore` calls into a single `useWorkflowShallowStore` call returning `{ startQuickAddFromOutput, hasOutgoing, isPending }`
- [x] 9.2 In `packages/flow/src/workflow/components/workflow-editor/workflow-editor.tsx` `CanvasContainer`, split the mixed data+command subscription into two separate `useWorkflowShallowStore` calls: one for `{ nodes, edges, edgeInsertPending }` and one for commands
- [x] 9.3 In `workflow-editor.tsx`, replace `useWorkflowStore(selectViewport, () => true)` with a named `captureOnce` equality function that makes the intent explicit
- [x] 9.4 Run `vitest run packages/flow` to confirm no regressions

## 10. Final Verification

- [x] 10.1 Run `pnpm typecheck` from repo root — no TypeScript errors (pre-existing @workspace/ui error unrelated to this change)
- [x] 10.2 Run `vitest run packages/flow` with coverage — 146/146 tests pass, ≥ 70% threshold met
- [x] 10.3 Run `vitest run packages/store` with coverage — 100% coverage, ≥ 90% threshold met
- [ ] 10.4 Manually verify: undo/redo, node drag, clipboard copy/paste, quick-add, edge-insert all work correctly in the browser
