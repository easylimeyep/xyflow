## 1. Model and geometry

- [x] 1.1 Add `WorkflowGroup`, `WorkflowGroupColor`, `WORKFLOW_GROUP_COLORS`, `DEFAULT_WORKFLOW_GROUP_COLOR`, `groups` on `WorkflowGraphState`, and optional `groupId` on node data; update graph factories, initial/default/sample graphs, and fixtures to `groups: []`; verify with `pnpm typecheck`
- [x] 1.2 Implement `group-geometry.ts` (`getMemberBounds` with `DEFAULT_NODE_WIDTH` / `getEstimatedNodeHeight` fallback, `growToFit`, `fitToContents`, `clampResize`, `getCollapsedCardRect`) and `clearDanglingGroupIds`; verify with unit tests for grow-only behavior, exact fit, empty-group minimum, resize clamping with the opposite edge fixed (left/top edge at the minimum), and the unmeasured-node fallback

## 2. Persistence (TDD: codec tests first)

- [x] 2.1 Add `DomainWorkflowGroupDTO` and `groups` decoding/validation to `toDomainDTO` (missing → `[]`, shape, finite numbers, positive size, unknown node, duplicate membership, duplicate id, unknown color → default, empty `nodeIds` allowed); verify with domain-dto tests covering every rejection and the normalization
- [x] 2.2 Convert between sorted `groups[].nodeIds` and `data.groupId` in `internalToDomain` / `domainToInternal`; verify with roundtrip tests for a regular group, an empty group, a collapsed group, and deterministic output
- [x] 2.3 Add `backend-export/backend-groups.ts` (`toBackendGroups`, `attachBackendGroups`), `BackendWorkflowGroupDTO`, and `groups` on `BackendWorkflowDTO`; wire into strict and draft export; verify tests: numeric sorted `nodeIds`, empty group, `groups: []` when none, `nodes` identical with and without groups, grouped workflow does not trip the unreachable-node check
- [x] 2.4 Extend the selection clipboard payload with `groups` (selected groups and whole-member groups, with rectangle and collapsed state); verify with clipboard tests for a whole group, a partial group, and an empty group

## 3. Commands and store

- [x] 3.1 Add `applyGroupNodesCommand`, `applyUngroupCommand`, `applyRenameGroupCommand`, `applyRecolorGroupCommand`, `applyResizeGroupCommand`, `applyFitGroupCommand`, `applySetGroupCollapsedCommand`, `applyMoveGroupCommand` with unique default labels; verify with graph-engine tests (group rejects grouped nodes, empty label rejected, collapse deselects members, move shifts rectangle and members)
- [x] 3.2 Add `selectedGroupIds` to the selection slice and expose group store actions; extend the drag-commit check in `graph-slice.ts` (`haveNodePositionsChanged`) to compare group rectangles; verify each action commits exactly one history step with a store test per action, including "undo moving an empty group"
- [x] 3.3 Extend `node-crud-slice`: deleting nodes keeps empty groups; `deleteGroups` removes members and their edges; the editor delete path (hotkey and command) deletes selected groups and nodes in one commit, a selected group winning over its selected members; duplicate and paste copy whole and selected groups with new ids and `DUPLICATE_NODE_OFFSET`, ungrouping partial copies; verify with store tests including "undo delete group restores everything in one step"
- [x] 3.4 Implement `resolveMembershipAfterDrag` (join, leave, move between groups, smallest-frame tie-break, collapsed cards ignored, `growToFit` of the target) and run it on node drag stop in the same commit and on palette / quick-add insertion; in a mixed drag run it only for non-member nodes; verify with unit tests per scenario and a store test for a single history step

## 4. Canvas frames and collapse

- [x] 4.1 Spike: render one derived `groupFrame` node with low `zIndex` and a `pointer-events: none` body; confirm in the running app that it sits behind nodes and edges and does not block pan or box select; record the outcome in design.md (switch to the `ViewportPortal` fallback if it fails)
- [x] 4.2 Implement `buildGroupCanvasNodes` (frame vs card, hidden members, memoized per group) and pass the projection to `ReactFlow`; make the large-graph check in `compact-node.tsx` count store nodes only; verify with projection unit tests and a canvas test that frames and cards render
- [x] 4.3 Implement `buildCanvasEdges` with proxy edges (omit internal, proxy boundary, card-to-card, merge duplicates, non-selectable/non-deletable/no insert); verify with unit tests for each row of the design table
- [x] 4.4 Implement the `GroupFrame` and `GroupCard` components: header with label, member count, collapse chevron, color via `tv` variants for light/dark, resizer in edit mode, decorative handles on the card, error indicator and observe-mode runtime status on the card; verify with component tests and a visual check in both themes
- [x] 4.5 Route `group-frame:` changes in `use-node-change-router` (drag → move group through the drag-history path, dropping React Flow position changes for members of dragged groups; resize → a frame `position` change without `dragging` or alongside a `resizing` dimensions change is part of the resize, clamped and committed on end; select → `selectedGroupIds` with the full-enclosure box rule, remove ignored); verify with router tests including "one undo restores the group and all members", "box touching a frame does not select it", "resizing from the left edge does not move members", and "a selected member of a dragged group moves once"
- [x] 4.6 Add the observe-mode collapse override in the canvas and expand-on-reveal in `revealNode` for both modes; verify with tests that the override does not touch the store or export and that revealing a hidden member expands its group

## 5. Commands UI

- [x] 5.1 Add `isAvailable` to `SelectionCommand` and the `group`, `ungroup`, `toggle-collapse` commands with the availability table from design D8; allow grouping a single node; render the group toolbar for selected groups and a group context menu (right-click on header or card) with the same commands; verify with selection-commands and selection-toolbar tests for every row of the table
- [x] 5.2 Add `Mod+G` / `Mod+Shift+G` to hotkeys through `isLetterHotkey`, with `preventDefault`, gated by availability; verify with hotkey unit and integration tests, including a Russian layout (`key` non-Latin, `code: "KeyG"`)
- [x] 5.3 Add inline rename (double-click header, Enter/blur commit, Esc cancel), the color picker, and "Fit to contents" on the group; make the header and card focusable with an `aria-label` (label and member count) and `Enter` selecting the group; disable all editing in observe mode; verify with component tests

## 6. Canvas search

- [x] 6.1 Make `SearchMatch` a union on `target` (`node` | `group`), match group labels under the `labels` source, order groups by frame position before nodes at the same position, and key the search index cache on `nodes` and `groups`; narrow node-only consumers on `target === "node"`; verify with `search/matches` and `search-selectors` tests: group match, labels filter off, group-before-member order, rename updates the match set, current match kept by identity
- [x] 6.2 Render group entries in the results panel, mark the matched label in the frame header and on the card, and reveal a group match by centering its header (collapsed card without expanding, no selection or history change); verify with results-panel and canvas tests

## 7. Auto-layout

- [x] 7.1 Treat collapsed groups as single ELK nodes in `buildElkGraph`, move hidden members by their block's delta, then fit non-empty expanded groups; verify with elk-layout tests: collapsed members keep relative positions, expanded frames enclose members, empty groups keep their rectangles

## 8. Integration checks

- [x] 8.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test:coverage` in `packages/flow`, plus the store performance budget test; verify all pass and coverage stays above the 70% threshold
- [x] 8.2 Add a Playwright e2e: group a selection → rename → drag header → resize → drag a node out → collapse → expand → delete group → undo; verify it passes with `pnpm test:e2e`
- [x] 8.3 Check manually in the web app: auto-layout with expanded and collapsed groups, observe mode with the collapse override, search reveal into a collapsed group and of a group label, a 100+ node graph, light/dark theme, minimap; confirm with screenshots
- [x] 8.4 Accept `groups` in `createInitialGraph` / `createInitialGraphElk` (validation, defaults, two-pass ELK for collapsed groups), export the group types from the package entry, and add the "Node Groups" Storybook story (edit and observe); verify with initial-graph group tests and a visual check of both stories
