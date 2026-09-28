## 1. Model and invariants

- [ ] 1.1 Add `WorkflowGroup`, `WorkflowGroupColor`, `WORKFLOW_GROUP_COLORS`, `DEFAULT_WORKFLOW_GROUP_COLOR`, `groups` on `WorkflowGraphState`, and optional `groupId` on node data; update graph factories and fixtures to use `groups: []`; verify with `pnpm typecheck`
- [ ] 1.2 Implement `pruneEmptyGroups` (drops groups with no members and clears dangling `groupId`) with unit tests for both cases; verify with `pnpm vitest run` on the new test file
- [ ] 1.3 Implement `computeGroupFrameRect(members, measure)` (bounds + padding + header, default size fallback) with unit tests; verify tests pass

## 2. Persistence (TDD: write codec tests first)

- [ ] 2.1 Add `DomainWorkflowGroupDTO` and optional `groups` decoding/validation to `toDomainDTO` (missing → `[]`, shape, empty `nodeIds`, unknown node, duplicate membership, duplicate id, unknown color → default); verify with new domain-dto tests covering every rejection and the normalization
- [ ] 2.2 Convert between `groups[].nodeIds` and `data.groupId` in `internalToDomain` / `domainToInternal`; verify with a domain roundtrip test that preserves id, label, color, members
- [ ] 2.3 Add `backend-export/backend-groups.ts` with `toBackendGroups` and `attachBackendGroups`, `BackendWorkflowGroupDTO`, and `groups` on `BackendWorkflowDTO`; wire into strict and draft export; verify tests: numeric sorted `nodeIds`, `groups: []` when none, `nodes` identical with and without groups, grouped workflow does not trip the unreachable-node check
- [ ] 2.4 Extend the selection clipboard payload with optional whole-group `groups`; verify with clipboard tests for whole-group and partial-group copies

## 3. Canvas frames

- [ ] 3.1 Spike: render one derived `groupFrame` node with low `zIndex` and `pointer-events: none` body; confirm in the running app that the frame sits behind nodes and edges and does not block pan/box-select; record outcome in design.md (switch to `ViewportPortal` fallback if it fails)
- [ ] 3.2 Implement `buildGroupFrameNodes(groups, nodes)` memoized per group and pass `[...frameNodes, ...nodes]` to `ReactFlow`; verify with a unit test for the projection and a canvas test that a frame renders for each group
- [ ] 3.3 Implement the `GroupFrame` node component (header with label, color via `tv` variants for light/dark, `dragHandle` on header, no handles); verify with a component test and a visual check in both themes
- [ ] 3.4 Route frame changes in `use-node-change-router` (drag delta → move members through the existing drag-history path, select → selected group, ignore dimensions/remove); verify with router tests including "one undo restores all members"

## 4. Commands and interactions

- [ ] 4.1 Add `groupNodes`, `ungroup`, `renameGroup`, `recolorGroup` commands with default unique labels; verify with graph-engine tests (regroup moves nodes from other groups, selected frames contribute their members, empty label rejected)
- [ ] 4.2 Call `pruneEmptyGroups` from node delete; regroup whole-group copies on duplicate and paste with new ids; verify with store tests
- [ ] 4.3 Implement `resolveMembershipAfterDrag` (join, leave, move between groups, smallest-frame tie-break, sole member cannot leave) and run it on node drag stop in the same commit; verify with unit tests for each scenario and a store test for a single history step
- [ ] 4.4 Add `Mod+G` / `Mod+Shift+G` to hotkeys and "Group" / "Ungroup" to the node context menu; verify with hotkey and context-menu tests
- [ ] 4.5 Add inline rename (double-click header, Enter/blur commit, Esc cancel) and color picker on the frame header; disable all editing controls in observe mode; verify with component tests

## 5. Verification

- [ ] 5.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test:coverage` in `packages/flow`; verify all pass and coverage stays above the 70% threshold
- [ ] 5.2 Add a Playwright e2e covering group selection → rename → drag header → drag a node out → undo; verify it passes with `pnpm test:e2e`
- [ ] 5.3 Manually check in the web app: auto-layout with groups, observe mode, light/dark theme, minimap; confirm with screenshots
