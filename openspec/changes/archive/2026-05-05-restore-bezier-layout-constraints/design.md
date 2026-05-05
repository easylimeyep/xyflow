## Context

The workflow editor historically rendered connections with React Flow Bezier paths. The `add-elk-edge-routing` change introduced optional ELK edge route metadata and changed `WorkflowEdgeComponent` to render ELK sections as straight SVG line segments when route data is present.

That implementation improved one class of overlap, but it changed the user-facing visual style and introduced a new readability issue: separate connections can visually share the same orthogonal corridor and look like they attach to each other. The workflow graph model still only supports node-to-node, handle-aware connections, so the remaining problem is presentation and layout clarity rather than graph semantics.

The new direction is to keep ELK as the node layout engine, restore Bezier connection rendering, and improve node placement/spacing/order so the large ELK example gives branch shortcut edges enough free space.

## Goals / Non-Goals

**Goals:**

- Restore the previous curved connection visual for workflow edges.
- Keep workflow connections semantically node-to-node and handle-aware.
- Improve ELK layout constraints so branch shortcut connections avoid passing visually under unrelated node bodies in the large ELK example.
- Keep the layout implementation production-ready with deterministic tests and a clear visual regression target.
- Remove or neutralize routed edge rendering paths that make connections look like they attach to other connections.

**Non-Goals:**

- Replacing ELK with another layout engine.
- Introducing edge-to-edge connection semantics.
- Building a custom obstacle-avoiding edge router independent from ELK.
- Continuously re-laying out the graph while users drag nodes.
- Guaranteeing that every possible arbitrary manual graph has zero visual crossings.

## Decisions

### Decision: Bezier rendering is the default workflow visual

`WorkflowEdgeComponent` should render the same Bezier-style paths it used before routed edge rendering. If route metadata remains in edge data temporarily, the renderer should ignore it for the standard workflow edge type.

Alternative considered: keep ELK orthogonal routing and round the corners. Rounded orthogonal paths would improve the harsh visual style, but separate edges could still visually merge in shared corridors and would still be a different visual language from the existing editor.

### Decision: Solve the original issue through ELK placement and spacing

The original problem was that a branch shortcut connection had no clear lane because intermediate nodes occupied the path between source and target. The preferred fix is to adjust ELK node placement, spacing, and ordering so branch paths and shortcut result paths get more vertical clearance.

Candidate levers include:

- More vertical spacing between nodes in the same layer for branch-heavy sections.
- Stronger ordering for branch output handles so true/false branches stay separated.
- Wider layer spacing around branch-to-result shortcut patterns.
- A post-layout vertical clearance pass for known shortcut edges if ELK options alone are insufficient.

Alternative considered: draw routed edge sections around nodes. That treats symptoms at the renderer layer and caused the visual regressions described in this change.

### Decision: Route metadata is not part of the production visual contract

The production contract should be about node positions and rendered connection semantics, not persisted ELK edge sections. Route metadata may be removed, or left as internal/transient data only if it does not affect the default renderer, mappers, or user-visible behavior.

Alternative considered: keep route metadata and conditionally render it only for dense examples. That would make examples diverge from the editor's normal behavior and risks reintroducing the same visual inconsistency later.

### Decision: Large ELK example is the visual regression target

The large ELK example should specifically exercise the `Auto approve?` style branch shortcut where the false output goes directly to a result while the true path continues through extractor and summary nodes. Tests should assert the graph remains connected to nodes/handles, and browser verification should inspect the rendered example for the target layout problem.

Alternative considered: only unit-test ELK option changes. Unit tests can catch graph semantics and deterministic output, but they cannot prove the user-facing overlap is resolved.

## Risks / Trade-offs

- ELK options may not fully prevent every visual crossing -> Add a focused post-layout clearance pass only for shortcut edges if spacing/order options are not enough.
- Increasing spacing can make large graphs wider or taller -> Tune only branch-heavy and shortcut-heavy constraints where possible, and keep viewport fit behavior unchanged.
- Removing route metadata too aggressively could break tests from the previous change -> Update or remove route-specific tests alongside the renderer rollback.
- Visual validation can be brittle -> Combine stable unit tests for semantics with a focused manual/browser check for the large ELK example.

## Migration Plan

1. Restore workflow edge rendering to Bezier behavior.
2. Remove or ignore ELK route metadata in the workflow edge renderer.
3. Tune ELK options and, if needed, add a deterministic node-position clearance step for branch shortcut edges.
4. Update tests to focus on Bezier rendering, node-to-node connection semantics, and layout clearance.
5. Verify the large ELK example visually, especially the branch shortcut from `Auto approve?` to `result true`.

Rollback is straightforward: the renderer can return to the pre-change Bezier implementation independently from ELK node positioning changes.

## Open Questions

- Should the previous `workflow-elk-edge-routing` change be archived as superseded, or should its route extraction code remain temporarily behind unused internals until cleanup?
- What exact visual threshold counts as acceptable clearance for the large ELK example: no edge crossing node bounding boxes, or no edge passing under the visible node card area with a fixed margin?

## Implementation Notes

- The clearance pass targets deterministic branch shortcut patterns where a branch output goes directly to a result while a sibling branch path also reaches that result. Arbitrary manual node placements can still create visual crossings until the user runs auto-layout or manually moves nodes.
- Browser verification sampled the `large-elk-edge-true-branch-to-result` Bezier path against the `Extract approval score` and `Set true summary` node rectangles and found no sampled intersections.
