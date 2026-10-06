# Design

## Context

- Global auto-layout lives in `layout/elk-layout.ts`. `computeWorkflowAutoLayout` builds a flat ELK graph (`buildElkGraph`), runs the async ELK engine, writes positions back (`applyElkLayout`), runs the evaluator shortcut clearance pass, and then fits every expanded group with `fitToContents` (`layout/elk-groups.ts`). It ignores group membership for expanded groups. That is the gap described in proposal.md.
- Group edits go through synchronous graph commands (`graph-engine/group-commands.ts`) and `commitResult` in `store/slices/group-slice.ts`. Today "Fit to contents" is `applyFitGroupCommand` → `fitGroupToContents`, and the button in `group-frame.tsx` is its only caller.
- The store layout slice (`store/slices/layout-slice.ts`) shows the async pattern: await ELK, commit with `commitGraphState` (one history entry), and report failures as `AUTO_LAYOUT_FAILED` in `lastError`.
- Positions are absolute and nodes are flat (no React Flow sub-flows). A group's members are the nodes whose `data.groupId` matches.

## Goals / Non-Goals

**Goals:**
- A pure, engine-injectable function that arranges one group and returns the next graph, testable without the real ELK.
- Reuse the existing ELK graph builder, options, ports, and clearance pass, so an arranged group looks like a piece of a global auto-layout.

**Non-Goals:**
- Hierarchical ELK (compound nodes) for the global auto-layout.
- Taking edges to outside nodes into account, for example as ports on the group boundary.
- Moving neighbours out of the way of a grown group.
- Arranging collapsed groups, or several groups at once.

## Decisions

### D1. `computeGroupArrangeLayout(registry, graph, groupId, engine?)` in `layout/elk-group-arrange.ts`

Steps:
1. Find the group. If it is missing, collapsed, or has no members, return the graph unchanged.
2. Members = `getGroupMembers`. Internal edges = edges whose source and target are both members.
3. `buildElkGraph(registry, members, internalEdges)` → `engine.layout`. Disconnected members are packed by ELK's component packing with the existing `componentComponent` spacing.
4. `applyElkLayout(members, layouted)`, then `applyEvaluatorShortcutClearance(…, internalEdges)`.
5. Re-anchor: compute `getMemberBounds` before and after, then translate every member by `(before.x − after.x, before.y − after.y)`. ELK places its output at about (0,0). Anchoring on the members' bounds rather than on the frame keeps the members where the user put them, even if the frame had slack.
6. Merge the moved members back into `graph.nodes` by id, then replace the group with `fitToContents(group, movedMembers)`.

It returns the same `graph` reference when nothing moved, so the store can skip a no-op commit.

*Alternative:* run the global `computeWorkflowAutoLayout` on a subgraph. Rejected: that function also handles collapsed blocks and refits every group, which is noise for a single group, and anchoring would still be needed.

### D2. Store action `arrangeGroup(groupId): Promise<boolean>` replaces `fitGroupToContents`

It lives in the group slice and follows `autoLayout`. It snapshots `get().graph`, awaits the layout, and then:
- if `get().graph !== snapshot`, it drops the result and returns `false`. The user edited the graph while ELK ran, and applying a layout computed for an old graph would undo that edit.
- if the result is the same reference, it clears `lastError` and returns `true` with no commit.
- otherwise `commitGraphState(set, next)`, which creates one history entry, so a single undo reverts both the positions and the frame.

It is guarded like the other group actions: a no-op in observe mode or when the group is collapsed or empty. On error it sets `lastError = AUTO_LAYOUT_FAILED` and returns `false`.

`applyFitGroupCommand` and `fitGroupToContents` are removed. `fitToContents` and `growToFit` stay, because grouping, auto-layout, and the initial graph builder use them.

*Alternative:* keep "Fit to contents" as a second button. Rejected by the user. Arrange always ends with a fit, so a separate fit would only matter for "fit without moving", and a manual resize already covers that.

### D3. Header button

In `group-frame.tsx`, the same slot and the same `editable` gate. Label and tooltip are "Arrange". The icon is a lucide layout icon (`LayoutGrid` or similar) in place of `Shrink`. It is disabled when `memberIds.length === 0` and while an arrange is running for that group (local pending state), so double clicks do not queue two layouts. A collapsed group renders a card without this header, so it needs no extra gate.

## Risks / Trade-offs

- [Edges to outside nodes are ignored, so entry and exit members can land on the "wrong" side] → Accepted for v1 (user decision). It can be improved later by adding boundary ports without changing the API.
- [An arranged group can overlap neighbours] → Accepted for v1 (user decision). Undo is one step.
- [The async gap lets the graph change before the result arrives] → The stale result is dropped (D2). The user can press Arrange again.
- [Unmeasured nodes use estimated sizes] → The same fallback as global auto-layout and `fitToContents`. In practice members are measured by the time a user presses the button.
- [Removing `fitGroupToContents` breaks any external caller] → It is not exported from the package entry. Only internal callers and tests use it, and they are updated in the same change.
