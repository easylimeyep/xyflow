# packages/flow baseline audit

Date: 2026-03-29

## High-impact rerender hotspots

- `workflow-editor.tsx`:
  - `ToolbarContainer` subscribes to `history` object instead of derived flags (`canUndo`, `canRedo`).
  - `ConfigPanelContainer` subscribes to full `nodes` and `edges`.
- `inline-expression-node.tsx` and `set-variable-node.tsx`:
  - each node instance subscribes to full `nodes` and `edges`;
  - each instance recomputes `buildExpressionVariableCatalog(...)`.
- `node-palette.tsx`:
  - entries are manually wired; adding new node kind requires touching multiple files.

## Store complexity baseline

- `src/workflow/store/store.ts` was a single ~1600-line module.
- It combined:
  - history transitions and commit strategy;
  - graph mutations and selection sync;
  - quick-add / edge-insert UI intents;
  - clipboard IO and import/export;
  - connection and variable-name validation;
  - geometry helpers for insertion placement.

## Critical behavior scenarios to protect

- node drag is transient and commits history only on drag end;
- edge insertion can split an edge into two edges and fallback to single edge path;
- quick-add and edge-insert clear pending state and keep selection consistent;
- clipboard copy/paste preserves internal links and handles unique label/variable naming;
- viewport updates do not create history entries.

## Test gaps at baseline

- no explicit coverage thresholds in `vitest.config.ts`;
- no dedicated perf budget checks;
- no ADR log for architecture choices around state slices, selector policy, and normalization.
