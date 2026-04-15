## Context

The workflow editor keeps graph state in a Zustand context store and delegates React Flow node updates through `useNodeChangeRouter`, `applyNodeChangesCommand`, and `graph-slice.onNodesChange`. In the live UI, adding a node produces the expected semantic history commit, but React Flow then emits a follow-up measurement/layout update for the mounted node. That runtime update currently flows through the same semantic history path, so undo first replays measurement state instead of removing the newly added node.

The defect is cross-cutting because it spans React Flow integration, history commit policy, and store-level graph mutation handling. We also observed that initial canvas mount can seed an unexpected history entry for the same reason.

## Goals / Non-Goals

**Goals:**
- Preserve a single semantic undo step for user-visible node creation.
- Continue storing React Flow measurement/layout data in `history.present` so the canvas stays correctly rendered.
- Prevent mount/layout-only node updates from creating new history entries during normal editing and initial mount.
- Add regression coverage for the real editor path, not just isolated store helpers.

**Non-Goals:**
- Changing public workflow editor APIs.
- Redesigning the overall history model or replacing React Flow.
- Reworking unrelated undo/redo semantics such as drag, delete, quick-add, or clipboard flows beyond required regression protection.

## Decisions

### Decision: Treat React Flow measurement/layout node changes as transient store updates

History policy should distinguish semantic graph mutations from runtime canvas metadata updates. Measurement/layout changes must still update `history.present`, but they must not call `pushHistoryState`.

Why this approach:
- It preserves canvas correctness without polluting undo/redo.
- It keeps history policy centralized in the store layer, close to `graph-slice.onNodesChange`.
- It aligns with the existing semantic model where drag-in-progress updates are already transient until commit.

Alternatives considered:
- Filter these changes out in `useNodeChangeRouter`: simpler, but pushes history policy into the UI adapter and risks losing runtime node metadata updates entirely.
- Strip `measured`/dimension fields from stored nodes: reduces churn, but fights React Flow’s controlled-node model and may destabilize layout/rendering.

### Decision: Add explicit change classification for node-change commit policy

The current `shouldCommitNodeHistory` helper treats every non-`position` change as semantic. We should introduce explicit classification so mount/layout-only changes use the transient update path while semantic changes continue to push history.

Why this approach:
- It makes the policy auditable and testable.
- It avoids hidden coupling to React Flow internals spread across multiple files.
- It leaves room to classify other non-semantic runtime updates in one place if needed.

Alternatives considered:
- Special-case this inside `applyNodeChangesCommand`: possible, but that mixes graph projection with history policy and makes the engine harder to reason about.

### Decision: Add regression tests that simulate post-add measurement updates

The existing store tests prove `addNode -> undo` in isolation, but they do not cover the follow-up measurement update that occurs in the live editor. New tests should model that sequence directly so the bug cannot regress.

Why this approach:
- It captures the actual failure mode.
- It protects both semantic history and transient update behavior.

Alternatives considered:
- Rely only on browser repro/manual verification: too brittle for a subtle history regression.

## Risks / Trade-offs

- [Risk] React Flow may emit more than one runtime-only change shape across versions. → Mitigation: classify transient updates conservatively and cover the known measurement-driven sequence in tests.
- [Risk] Over-filtering node changes could suppress a real semantic update. → Mitigation: keep semantic vs transient logic narrow, and add regression coverage for add, drag, quick-add, edge insert, and delete flows.
- [Risk] Initial mount cleanup could change current `canUndo` behavior on first load. → Mitigation: codify the desired behavior in tests so the toolbar reflects true user history, not canvas bootstrapping noise.
