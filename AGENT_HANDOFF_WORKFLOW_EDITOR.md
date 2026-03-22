# AGENT HANDOFF: React Flow n8n-like MVP

## Context

This document summarizes what was implemented for the React Flow based n8n-like MVP editor, including architecture, major code changes, performance fixes, test coverage, and follow-up recommendations.

## What Was Built

### 1) Workflow editor architecture

Implemented a decomposed editor in `@workspace/flow`:

- `WorkflowEditor` as top-level composition layer
- `WorkflowCanvas` for React Flow rendering and interactions
- `NodePalette` for node selection and drag source
- `NodeConfigPanel` for dynamic node configuration forms
- `EditorToolbar` for undo/redo and JSON import/export

Main entry:

- `packages/flow/src/index.tsx` now renders `WorkflowEditor` instead of a basic inline ReactFlow setup.

### 2) Types, models, and node registry

Added workflow domain and editor models:

- `NodeKind` set: `trigger | branch | transform | code | customInput`
- `WorkflowNodeData`, `WorkflowEdge`, `WorkflowGraphState`
- `DomainWorkflowDTO` and related DTOs for backend-facing format

Added node registry with:

- display metadata (title/description)
- field schemas for config UI
- default config builders
- allowed node connection rules

Files:

- `packages/flow/src/workflow/types.ts`
- `packages/flow/src/workflow/node-registry.ts`
- `packages/flow/src/workflow/default-graph.ts`

### 3) State management with undo/redo history

Implemented history utilities in `@workspace/store` and connected them in `@workspace/flow`:

- generic `createHistoryState`, `pushHistoryState`, `undoHistoryState`, `redoHistoryState`
- workflow store with actions:
  - add/update nodes
  - apply node/edge changes
  - connect validation
  - import/export
  - undo/redo

Files:

- `packages/store/src/index.tsx`
- `packages/flow/src/workflow/store.ts`

### 4) Base node components

Added custom node renderers and node types mapping:

- `TriggerNode`
- `BranchNode`
- `TransformNode`
- `CodeNode`
- `CustomInputNode`
- `NodeShell` shared visual wrapper
- `workflowNodeTypes` map for React Flow

Files:

- `packages/flow/src/workflow/nodes/node-shell.tsx`
- `packages/flow/src/workflow/nodes/trigger-node.tsx`
- `packages/flow/src/workflow/nodes/branch-node.tsx`
- `packages/flow/src/workflow/nodes/transform-node.tsx`
- `packages/flow/src/workflow/nodes/code-node.tsx`
- `packages/flow/src/workflow/nodes/custom-input-node.tsx`
- `packages/flow/src/workflow/nodes/node-types.ts`

### 5) Validation layer

Implemented connection validation rules:

- unknown source/target rejection
- node-kind compatibility checks using registry
- duplicate edge prevention
- cycle prevention via adjacency traversal

File:

- `packages/flow/src/workflow/validation.ts`

### 6) JSON mapping and import/export

Implemented dual-format support:

- internal graph JSON (`nodes`, `edges`, `viewport`)
- domain DTO JSON (`nodes`, `connections`, metadata)

Implemented:

- `internalToDomain`
- `domainToInternal`
- import parsing/normalization for both shapes
- export helpers for internal and domain format

File:

- `packages/flow/src/workflow/mappers.ts`

### 7) UI interaction features

Implemented:

- drag-and-drop from palette to canvas
- node selection and config editing
- keyboard undo/redo
- copy export JSON
- import from pasted JSON
- status/error surfacing

Files:

- `packages/flow/src/workflow/components/workflow-editor.tsx`
- `packages/flow/src/workflow/components/workflow-canvas.tsx`
- `packages/flow/src/workflow/components/node-palette.tsx`
- `packages/flow/src/workflow/components/node-config-panel.tsx`
- `packages/flow/src/workflow/components/editor-toolbar.tsx`
- `packages/flow/src/workflow/dnd.ts`

## Additional fixes requested later

### A) Canvas lag / performance

Main cause: excessive history snapshots and controlled viewport churn.

Fixes applied:

1. **History write throttling by semantic change**
- `onNodesChange`:
  - push to history only for `add/remove/replace` and `position` with `dragging=false`
  - otherwise update only `history.present` (no stack push)
- `onEdgesChange`:
  - push for `add/remove/replace`
  - otherwise only update present state

2. **Viewport handling**
- switched from controlled `viewport` prop to `defaultViewport`
- removed history push on `onMoveEnd`; now only updates `present.viewport`

Expected effect:

- significantly fewer heavy state snapshots during pan/drag
- less render pressure and smoother canvas movement

### B) Branch node true/false labels overlap

Fixes applied:

- separated source handles vertically with explicit `style.top`
- placed `true` and `false` labels next to corresponding handles
- improved readability with color distinction

File:

- `packages/flow/src/workflow/nodes/branch-node.tsx`

### C) Node icons in palette

Added icons per node kind in palette:

- trigger -> `Play`
- branch -> `GitBranch`
- transform -> `WandSparkles`
- code -> `Code2`
- customInput -> `FileInput`

File:

- `packages/flow/src/workflow/components/node-palette.tsx`

Dependency:

- `lucide-react` added to `packages/flow/package.json`

### D) n8n-like Expression Editor MVP

Implemented expression-capable config editing with n8n-like variable references and autocomplete.

Core behavior added:

- mixed literal + expression input (`text with {{ ... }}`)
- no runtime execution in UI (syntax validation only)
- n8n-like references by node label: `$("Node Label").item.json.field`
- variable availability from:
  - current input helpers (`$input.item.json`, `$input.first().json`, `$input.all()`)
  - reachable upstream nodes (reverse traversal by edges)

Main files:

- `packages/flow/src/workflow/components/expression-input.tsx`
- `packages/flow/src/workflow/components/node-config-panel.tsx`
- `packages/flow/src/workflow/components/workflow-editor.tsx`
- `packages/flow/src/workflow/expression/template.ts`
- `packages/flow/src/workflow/expression/variables.ts`
- `packages/flow/src/workflow/expression/autocomplete.ts`
- `packages/flow/src/workflow/types.ts`
- `packages/flow/src/workflow/node-registry.ts`
- `packages/flow/src/style.css`

Details:

1. **Reusable expression input**
- Added `ExpressionInput` based on CodeMirror 6.
- Supports:
  - editing raw mixed text
  - variable insertion via picker (`{{ expr }}` wrapping)
  - inline syntax error indicator from parser/validator

2. **Node config panel integration**
- Extended field schema with `ui?: "default" | "expression"`.
- Switched selected fields to expression mode in node registry:
  - `trigger.eventName`
  - `branch.condition`
  - `transform.expression`
  - `code.code`
  - `customInput.inputText`

3. **Variable catalog from graph**
- Added upstream resolver that walks incoming edges from selected node.
- Built grouped options for current input and upstream nodes.
- Added minimal output-path metadata per node kind in registry for better suggestions.

4. **Template parsing and validation**
- Added parser to split literal/expression segments.
- Added safe JS expression validation with `acorn` (no eval/sandbox execution).
- Handles:
  - empty expression
  - invalid JS expression
  - missing closing braces

5. **CodeMirror autocomplete**
- Added completion source for built-ins + upstream variable options.
- Added query filtering and bounded completion list.
- Styled CodeMirror completion popup with shadcn-like tokens via custom tooltip class.

### E) Undo/Redo conflict fix for embedded editors

Issue fixed:

- global workflow hotkeys (`Cmd/Ctrl+Z`, redo variants) were firing even when focus was inside editable fields (including CodeMirror), causing perceived “undo then rollback” conflicts.

Fix:

- extracted hotkey logic into:
  - `packages/flow/src/workflow/components/hotkeys.ts`
- global handler now ignores events from:
  - `input`, `textarea`, `select`
  - `contenteditable` targets
  - any target within `.cm-editor`
- `WorkflowEditor` now uses `createHistoryHotkeyHandler(...)` instead of raw inline keydown logic.

## Testing and quality gates

### Unit tests (Vitest)

Added tests:

- `packages/flow/src/workflow/mappers.test.ts`
- `packages/flow/src/workflow/validation.test.ts`
- `packages/flow/src/workflow/history.test.ts`
- `packages/flow/src/workflow/store.test.ts`
- `packages/flow/src/workflow/expression/template.test.ts`
- `packages/flow/src/workflow/expression/variables.test.ts`
- `packages/flow/src/workflow/expression/autocomplete.test.ts`
- `packages/flow/src/workflow/expression/autocomplete.integration.test.ts`
- `packages/flow/src/workflow/components/node-config-panel.test.tsx`
- `packages/flow/src/workflow/components/expression-input.integration.test.tsx`
- `packages/flow/src/workflow/components/hotkeys.test.ts`
- `packages/flow/src/workflow/components/hotkeys.integration.test.ts`

Test config:

- `packages/flow/vitest.config.ts`

Script:

- `packages/flow/package.json` -> `"test": "vitest run"`

### Verified commands

Executed successfully:

- `pnpm --filter @workspace/store typecheck`
- `pnpm --filter @workspace/flow typecheck`
- `pnpm --filter @workspace/flow lint`
- `pnpm --filter @workspace/store lint`
- `pnpm --filter @workspace/flow test`
- `pnpm --filter web typecheck`
- `pnpm --filter @workspace/flow typecheck`

### Type strictness constraints

Checked and kept:

- no `any`
- no `as any`
- unknown external data handled with narrowing/type guards

## Config/dependency changes

### Updated

- `packages/flow/package.json`
  - added `@workspace/ui` dependency
  - added `lucide-react` dependency
  - added CodeMirror deps:
    - `@codemirror/state`
    - `@codemirror/view`
    - `@codemirror/lang-javascript`
    - `@codemirror/autocomplete`
    - `@uiw/react-codemirror`
  - added `acorn`
  - added testing deps for component/integration tests:
    - `@testing-library/react`
    - `@testing-library/user-event`
    - `jsdom`
    - `react` / `react-dom` (dev for tests)
  - added `vitest` devDependency
  - added `test` script

- `packages/flow/tsconfig.json`
  - `module: ESNext`
  - `moduleResolution: Bundler`

- `packages/store/tsconfig.json`
  - `module: ESNext`
  - `moduleResolution: Bundler`

- `pnpm-lock.yaml`
  - updated after dependency changes

## Notes for next agent

1. **If canvas still lags in larger graphs**, profile with browser CPU profiler while:
   - panning canvas
   - dragging multiple nodes
   - rapidly changing selection
   Then optimize by memoizing expensive UI and narrowing store subscriptions.

2. **Potential optimization path**
   - move `isValidConnection` to a memoized callback with indexed lookup maps
   - avoid recreating large arrays for trivial updates where safe
   - consider splitting history from transient drag state

3. **Potential UX follow-ups**
   - better handle label positioning with custom edge/handle label components
   - add hover tooltips and search/filter in palette
   - add dedicated import/export modal with schema diagnostics

4. **Potential QA follow-ups**
   - add integration tests for drag-and-drop and branch-handle interactions
   - add performance smoke test scenario for pan/drag responsiveness

5. **Expression editor follow-ups**
   - add richer completion item rendering (2-line label + description directly in CM dropdown)
   - prioritize nearest upstream nodes before distant ones in completion ranking
   - add optional trigger on typing `{{` to open completion automatically
   - define backend/runtime contract for expression evaluation phase (currently intentionally UI-only validation)

## Latest architecture updates (current source of truth)

This section reflects the latest refactor state and supersedes older conflicting details above.

### 1) Store/editor architecture hardening

- `WorkflowEditor` was decomposed into container components:
  - `ToolbarContainer`
  - `PaletteContainer`
  - `CanvasContainer`
  - `ConfigPanelContainer`
- Store access in editor now uses `useWorkflowShallowStore` for aggregated subscriptions and lower render churn.
- `store.onMoveEnd` was replaced with `store.setViewport(viewport)` to make viewport updates explicit in app layer API.
- Selection consistency improved: when selected node is removed via `onNodesChange`, `selectedNodeId` is cleared.

Files:

- `packages/flow/src/workflow/components/workflow-editor.tsx`
- `packages/flow/src/workflow/store.ts`

### 2) Viewport synchronization model

- Canvas now uses controlled viewport:
  - `ReactFlow` uses `viewport={...}` (not `defaultViewport`)
  - `onMoveEnd` forwards to `onViewportChange`
- This keeps store and canvas viewport state aligned.

Files:

- `packages/flow/src/workflow/components/workflow-canvas.tsx`
- `packages/flow/src/workflow/store.ts`

### 3) Expression contract changes

- Expression node references are now stable-id based:
  - `$node("<nodeId>").item.json...`
- Built-in expression variables/completions are centralized in one module to avoid duplication.
- Legacy label-based reference migration support was removed intentionally (development stage, no backward-compatibility requirement).

Files:

- `packages/flow/src/workflow/expression/variables.ts`
- `packages/flow/src/workflow/expression/autocomplete.ts`
- `packages/flow/src/workflow/expression/builtins.ts`

Removed:

- `packages/flow/src/workflow/expression/migration.ts`
- `packages/flow/src/workflow/expression/migration.test.ts`

### 4) Mapper decomposition and import contract simplification

`mappers.ts` was split into folder modules:

- `packages/flow/src/workflow/mappers/index.ts` (public re-exports)
- `packages/flow/src/workflow/mappers/constants.ts`
- `packages/flow/src/workflow/mappers/utils.ts` (pure helpers like `isString`, `asRecord`, `toJsonConfig`, `sanitizeConfigValue`)
- `packages/flow/src/workflow/mappers/domain-dto.ts` (DTO shape validation/parsing)
- `packages/flow/src/workflow/mappers/converters.ts` (`internalToDomain`, `domainToInternal`, exports)
- `packages/flow/src/workflow/mappers/parser.ts` (`parseInternalGraphJson`, `isValidDomainDto`)

Contract change:

- Import is now **domain DTO only**.
- Internal graph JSON import support was removed.
- Toolbar placeholder updated accordingly: `Paste domain workflow JSON`.

Files:

- `packages/flow/src/workflow/components/editor-toolbar.tsx`
- `packages/flow/src/workflow/mappers/*`

### 5) Workflow graph model updates

- `WorkflowGraphState` now includes:
  - `document.id`
  - `document.name`
  - `document.version`
  - `document.metadata`
- `DomainWorkflowDTO.metadata` is `JsonObject` (not a fixed literal type).

Files:

- `packages/flow/src/workflow/types.ts`
- `packages/flow/src/workflow/default-graph.ts`
- `packages/flow/src/workflow/store.ts`
- `packages/flow/src/workflow/mappers/converters.ts`

### 6) Test suite updates (Vitest only, no E2E)

Added/expanded integration and architecture-critical tests:

- `packages/flow/src/workflow/components/editor-toolbar.test.tsx`
- `packages/flow/src/workflow/components/workflow-canvas.test.tsx`
- `packages/flow/src/workflow/components/workflow-editor.test.tsx`
- `packages/flow/src/workflow/store.test.ts` (more invariants)
- `packages/flow/src/workflow/validation.test.ts` (kind resolution)
- updated expression tests for `$node("<id>")` contract

Current validation status (latest run):

- `pnpm --filter @workspace/flow test` -> passed
- `pnpm --filter @workspace/flow typecheck` -> passed
- `pnpm --filter @workspace/flow lint` -> passed

