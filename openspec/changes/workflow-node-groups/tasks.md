## 1. Model and geometry

- [ ] 1.1 Add `WorkflowGroup`, `WorkflowGroupColor`, `WORKFLOW_GROUP_COLORS`, `DEFAULT_WORKFLOW_GROUP_COLOR`, `groups` on `WorkflowGraphState`, and optional `groupId` on node data; update graph factories, initial/default/sample graphs, and fixtures to `groups: []`; verify with `pnpm typecheck`
- [ ] 1.2 Implement `group-geometry.ts` (`getMemberBounds` with `DEFAULT_NODE_WIDTH` / `getEstimatedNodeHeight` fallback, `growToFit`, `fitToContents`, `clampResize`, `getCollapsedCardRect`) and `clearDanglingGroupIds`; verify with unit tests for grow-only behavior, exact fit, empty-group minimum, resize clamping, and the unmeasured-node fallback

## 2. Persistence (TDD: codec tests first)

- [ ] 2.1 Add `DomainWorkflowGroupDTO` and `groups` decoding/validation to `toDomainDTO` (missing → `[]`, shape, finite numbers, positive size, unknown node, duplicate membership, duplicate id, unknown color → default, empty `nodeIds` allowed); verify with domain-dto tests covering every rejection and the normalization
- [ ] 2.2 Convert between sorted `groups[].nodeIds` and `data.groupId` in `internalToDomain` / `domainToInternal`; verify with roundtrip tests for a regular group, an empty group, a collapsed group, and deterministic output
- [ ] 2.3 Add `backend-export/backend-groups.ts` (`toBackendGroups`, `attachBackendGroups`), `BackendWorkflowGroupDTO`, and `groups` on `BackendWorkflowDTO`; wire into strict and draft export; verify tests: numeric sorted `nodeIds`, empty group, `groups: []` when none, `nodes` identical with and without groups, grouped workflow does not trip the unreachable-node check
- [ ] 2.4 Extend the selection clipboard payload with `groups` (selected groups and whole-member groups, with rectangle and collapsed state); verify with clipboard tests for a whole group, a partial group, and an empty group

## 3. Commands and store

- [ ] 3.1 Add `applyGroupNodesCommand`, `applyUngroupCommand`, `applyRenameGroupCommand`, `applyRecolorGroupCommand`, `applyResizeGroupCommand`, `applyFitGroupCommand`, `applySetGroupCollapsedCommand`, `applyMoveGroupCommand` with unique default labels; verify with graph-engine tests (group rejects grouped nodes, empty label rejected, collapse deselects members, move shifts rectangle and members)
- [ ] 3.2 Add `selectedGroupIds` to the selection slice and expose group store actions; verify each action commits exactly one history step with a store test per action
- [ ] 3.3 Extend `node-crud-slice`: deleting nodes keeps empty groups; `deleteGroups` removes members and their edges; duplicate and paste copy whole and selected groups with new ids and `DUPLICATE_NODE_OFFSET`, ungrouping partial copies; verify with store tests including "undo delete group restores everything in one step"
- [ ] 3.4 Implement `resolveMembershipAfterDrag` (join, leave, move between groups, smallest-frame tie-break, collapsed cards ignored, `growToFit` of the target) and run it on node drag stop in the same commit and on palette / quick-add insertion; verify with unit tests per scenario and a store test for a single history step

## 4. Canvas frames and collapse

- [ ] 4.1 Spike: render one derived `groupFrame` node with low `zIndex` and a `pointer-events: none` body; confirm in the running app that it sits behind nodes and edges and does not block pan or box select; record the outcome in design.md (switch to the `ViewportPortal` fallback if it fails)
- [ ] 4.2 Implement `buildGroupCanvasNodes` (frame vs card, hidden members, memoized per group) and pass the projection to `ReactFlow`; make the large-graph check in `compact-node.tsx` count store nodes only; verify with projection unit tests and a canvas test that frames and cards render
- [ ] 4.3 Implement `buildCanvasEdges` with proxy edges (omit internal, proxy boundary, card-to-card, merge duplicates, non-selectable/non-deletable/no insert); verify with unit tests for each row of the design table
- [ ] 4.4 Implement the `GroupFrame` and `GroupCard` components: header with label, member count, collapse chevron, color via `tv` variants for light/dark, resizer in edit mode, decorative handles on the card, error indicator and observe-mode runtime status on the card; verify with component tests and a visual check in both themes
- [ ] 4.5 Route `group-frame:` changes in `use-node-change-router` (drag → move group through the drag-history path, resizer dimensions → clamp and commit on end, select → `selectedGroupIds` with the full-enclosure box rule, remove ignored); verify with router tests including "one undo restores the group and all members" and "box touching a frame does not select it"
- [ ] 4.6 Add the observe-mode collapse override in the canvas and expand-on-reveal in `revealNode` for both modes; verify with tests that the override does not touch the store or export and that revealing a hidden member expands its group

## 5. Commands UI

- [ ] 5.1 Add `isAvailable` to `SelectionCommand` and the `group`, `ungroup`, `toggle-collapse` commands with the availability table from design D8; render the group toolbar for selected groups; verify with selection-commands and selection-toolbar tests for every row of the table
- [ ] 5.2 Add `Mod+G` / `Mod+Shift+G` to hotkeys with `preventDefault`, gated by availability; verify with hotkey unit and integration tests
- [ ] 5.3 Add inline rename (double-click header, Enter/blur commit, Esc cancel), the color picker, and "Fit to contents" on the group; disable all editing in observe mode; verify with component tests

## 6. Auto-layout

- [ ] 6.1 Treat collapsed groups as single ELK nodes in `buildElkGraph`, move hidden members by their block's delta, then fit non-empty expanded groups; verify with elk-layout tests: collapsed members keep relative positions, expanded frames enclose members, empty groups keep their rectangles

## 7. Integration checks

- [ ] 7.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test:coverage` in `packages/flow`, plus the store performance budget test; verify all pass and coverage stays above the 70% threshold
- [ ] 7.2 Add a Playwright e2e: group a selection → rename → drag header → resize → drag a node out → collapse → expand → delete group → undo; verify it passes with `pnpm test:e2e`
- [ ] 7.3 Check manually in the web app: auto-layout with expanded and collapsed groups, observe mode with the collapse override, search reveal into a collapsed group, a 100+ node graph, light/dark theme, minimap; confirm with screenshots
