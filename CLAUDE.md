# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a pnpm monorepo for a visual workflow editor built on top of the [@xyflow/react](https://reactflow.dev/) library. The primary product is a node-based flow editor where users can build workflows by connecting typed nodes.

## Commands

All commands can be run from the repo root via Turbo, or inside individual packages.

```bash
# Root-level (runs across all packages via Turbo)
pnpm dev          # Start all packages in dev mode
pnpm build        # Build all packages
pnpm lint         # Lint all packages
pnpm format       # Format with Prettier
pnpm typecheck    # TypeScript type checking

# Testing (only in packages/flow and packages/store)
pnpm test                # Run tests once (vitest)
pnpm test:coverage       # Run with coverage report

# Run a single test file
cd packages/flow && pnpm vitest run src/path/to/file.test.ts
```

## Monorepo Structure

- **`apps/web`** — Next.js 16 app (App Router, Turbopack). Entry point renders the `Flow` component from `@workspace/flow`.
- **`packages/flow`** — The core workflow editor. Exports `Flow` (wraps `WorkflowEditor` in `WorkflowStoreProvider`).
- **`packages/store`** — Zustand utilities: history (undo/redo), context-based store creation.
- **`packages/ui`** — 57 shadcn/ui components exported via `@workspace/ui/components/*` and `@workspace/ui/hooks/*`.
- **`packages/eslint-config`** / **`packages/typescript-config`** — Shared tooling configs.

## Architecture of `packages/flow`

The flow package is the heart of the application. Key areas:

### State
`workflow/store/` — Zustand store powering the editor. The store holds nodes, edges, selection state, history, and node config panel visibility.

### Node System
- `workflow/nodes/` — Node type implementations organized by category: `data/`, `control/`, `logic/`, `io/`.
- `workflow/node-registry/` — Central registry mapping node type strings to their definitions (config, default data, ports).

### Expression System
`workflow/expression/` — Evaluates and autocompletes expressions entered in node fields. Parses templates, resolves variable references across connected nodes, and handles refactoring when nodes/handles are renamed.

### Components
- `WorkflowCanvas` — Wraps `@xyflow/react`'s `ReactFlow` component; owns viewport and edge rendering.
- `NodePalette` — Drag-and-drop panel to add new nodes; uses `@dnd-kit`.
- `NodeConfigPanel` — Right-side panel for configuring the selected node's properties.
- `ExpressionInput` — CodeMirror editor with custom autocomplete for the expression system.
- `EditorToolbar` — Top toolbar (undo/redo, zoom, etc.).

### Mappers & Validation
- `workflow/mappers/` — Convert between the internal domain model and the React Flow node/edge format.
- `workflow/validation/` — Input validation (uses Zod internally).

## Key Tech

- **React 19**, **TypeScript 5**, **Next.js 16**
- **@xyflow/react 12** for the canvas/graph engine
- **Zustand 5** for state; `packages/store` adds history and context-store utilities
- **Tailwind CSS 4**, **shadcn/ui** (Radix UI-based) for styling
- **@dnd-kit** for drag-and-drop (node palette → canvas)
- **CodeMirror** (`@uiw/react-codemirror`) for the expression editor
- **Vitest** for testing (jsdom environment); coverage thresholds: 70% for `flow`, 90% for `store`

## Flow Package Styling

- In `packages/flow`, do not import or use `cn` for class composition.
- Compose component classes with `tv` from `tailwind-variants`.
- Prefer local or exported `tv` style definitions with slots and variants; pass `className` overrides through those slots when needed.
- Keep shared UI helpers such as `cn` inside `packages/ui`; `packages/flow` should not depend on them.
