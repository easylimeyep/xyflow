## Context

The workflow editor has a `defineNode` factory (`node-registry/define-node.ts`) that accepts a declarative configuration object: kind, title, icon, category, fields, outputPaths, allowedTargets, and optional overrides. All node types are registered in `node-registry/registry.ts` by adding them to the `allDefinitions` array. The `NodeFieldSchema` type already supports `type: "select"` with `options: FieldOption[]`, so no new field types are needed.

Existing nodes live under `packages/flow/src/workflow/nodes/<category>/`. The `Result` node is a terminal node — it consumes values but produces no outputs downstream — so `outputPaths` will be empty and no `allowedTargets` are needed.

## Goals / Non-Goals

**Goals:**
- Add a `result` node type with a single `Category` select field (`true` / `false`)
- Register it in the node registry so it appears on the canvas and in the palette
- Follow the existing `defineNode` pattern exactly — no new abstractions

**Non-Goals:**
- Evaluating or acting on the selected category at runtime (execution engine is out of scope)
- Supporting more than two category values in this iteration
- Custom node component (the default shell is sufficient)

## Decisions

### Decision: Place node under `logic/` category

The `Result` node represents a classification endpoint of a logical flow. The `logic` category is the closest semantic fit (`branch` also lives there). Alternatively `io` could apply, but the `NodeCategory` type in `define-node.ts` includes `"io"` yet no `io/` folder exists, so `logic` avoids creating a new folder structure while remaining semantically appropriate.

**Alternative considered**: New `io` category folder — rejected to keep scope minimal and avoid dead structure.

### Decision: Use `type: "select"` with hardcoded options in the definition

`NodeFieldSchema` already supports `options: FieldOption[]` with `type: "select"`. The two options (`true`, `false`) are fixed domain values, so they belong in the node definition rather than being user-configurable.

### Decision: No output handles (`outputPaths: []`, `showTarget: true`)

`Result` is a terminal node — it receives a value and classifies it. It has an input handle (default, `showTarget: true`) but no output handles. `outputPaths: []` achieves this.

## Risks / Trade-offs

- `NodeKind` union is derived from `allDefinitions` at compile time — adding `result` to the array automatically expands the union. No manual type changes needed, but existing exhaustive switches over `NodeKind` (if any) will require a new case. → Check for exhaustive switches before merging.
- Empty `allowedTargets` means the node cannot be connected as a source, which is intentional. However if other nodes' `allowedTargets` lists need to include `"result"` as a valid connection target, those definitions may need updating. → Verify connection rules after implementation.
