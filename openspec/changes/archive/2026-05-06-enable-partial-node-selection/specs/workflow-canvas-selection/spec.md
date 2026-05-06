## ADDED Requirements

### Requirement: Workflow canvas selects partially overlapped nodes
The workflow canvas SHALL select workflow nodes that partially overlap the drag-selection rectangle when users perform rectangle selection on the canvas.

#### Scenario: Selection rectangle partially overlaps a node
- **WHEN** a user drags a selection rectangle across the workflow canvas
- **AND** the selection rectangle overlaps any visible, selectable part of a workflow node
- **THEN** that workflow node MUST become selected
- **AND** the workflow selection state MUST include that node ID

#### Scenario: Selection rectangle fully contains a node
- **WHEN** a user drags a selection rectangle that fully contains a workflow node
- **THEN** that workflow node MUST become selected
- **AND** the workflow selection state MUST include that node ID

#### Scenario: Selection rectangle does not overlap a node
- **WHEN** a user drags a selection rectangle that does not overlap a workflow node
- **THEN** that workflow node MUST NOT become selected because of that drag selection
