## MODIFIED Requirements

### Requirement: Auto-layout repositions the current workflow into a readable directed layout
When the auto-layout action is invoked, the editor SHALL compute new positions for the current workflow graph and apply them as a left-to-right directed arrangement without changing node identity, edge identity, workflow connectivity, or the standard curved workflow connection visual.

#### Scenario: Auto-layout preserves graph meaning
- **WHEN** a user runs auto-layout on a workflow graph
- **THEN** the resulting graph SHALL preserve the same node ids and edge ids as before layout
- **AND** the source/target relationships of all existing connections MUST remain unchanged
- **AND** connections MUST remain node-to-node and handle-aware rather than becoming edge-to-edge relationships.

#### Scenario: Auto-layout uses handle-aware branch placement
- **WHEN** a workflow graph contains nodes with multiple named output handles such as branch outputs
- **THEN** the computed layout MUST preserve distinct routing anchors for those handles so the resulting arrangement remains readable for each branch path
- **AND** branch paths that skip over a longer path SHOULD receive enough node-placement clearance to avoid visually passing under unrelated node bodies when the layout engine can provide that clearance deterministically.

#### Scenario: Auto-layout does not force routed edge rendering
- **WHEN** a user runs auto-layout on a workflow graph
- **THEN** the editor SHALL apply node position changes needed for the directed layout
- **AND** the standard workflow edge renderer SHALL continue to render curved connections from React Flow source and target handle coordinates.
