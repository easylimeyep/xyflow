# Spec Delta

## MODIFIED Requirements

### Requirement: Group frame geometry

A group SHALL own its rectangle. Member nodes SHALL keep absolute positions. When a member is moved so that it no longer fits inside the frame, the frame SHALL grow to enclose it. The frame SHALL NOT shrink on its own. The frame SHALL be drawn behind nodes and edges, so it SHALL NOT block clicks or drags on the edges and nodes above it. The frame's body SHALL take the pointer as a node does. A box selection SHALL still be able to start on it.

#### Scenario: Frame grows to follow a member

- **WHEN** a member node is dragged past the right edge of its group frame
- **THEN** the frame MUST grow so that it encloses the member while the drag is in progress
- **AND** the move and the growth MUST commit as one history step when the drag ends

#### Scenario: Frame does not shrink on its own

- **WHEN** a member near the frame edge is dragged toward the center of the frame
- **THEN** the frame rectangle MUST stay unchanged

#### Scenario: Content above a frame keeps its behavior

- **WHEN** the user clicks or drags a member node, or clicks an edge, inside a group frame
- **THEN** that node or edge MUST be handled as it is outside a frame
- **AND** the group MUST NOT be selected or moved

#### Scenario: Box selection from a frame body

- **WHEN** the user holds the box selection key and drags starting on the body of a group frame
- **THEN** a box selection MUST start
- **AND** the group MUST NOT move

#### Scenario: Panning through a frame body

- **WHEN** the canvas is in observe mode and the user drags starting on the body of a group frame
- **THEN** the canvas MUST pan as it does on an empty area
- **WHEN** the canvas is in edit mode and the user drags starting on the body of a group frame
- **THEN** the canvas MUST NOT pan and the group MUST move instead

### Requirement: Selecting groups

Clicking a group header or the empty area of an expanded group frame SHALL select the group. Clicking a member node SHALL select the node and not the group. A box selection SHALL select a group only when the box encloses the whole frame; otherwise it SHALL select the nodes it touches as it does today. Groups and nodes SHALL be selectable together with a modifier click.

#### Scenario: Header click selects the group

- **WHEN** the user clicks a group header
- **THEN** the group MUST be selected and its member nodes MUST NOT be selected

#### Scenario: Body click selects the group

- **WHEN** the user clicks the empty area inside an expanded group frame, away from its header, member nodes, and edges
- **THEN** the group MUST be selected
- **AND** no node MUST be selected and no other group MUST be selected

#### Scenario: Modifier body click toggles the group

- **WHEN** a node is selected and the user clicks the empty area of an unselected expanded group frame while holding Ctrl or Cmd
- **THEN** the group MUST be added to the selection
- **AND** the node MUST stay selected

#### Scenario: Box touching a frame selects only nodes

- **WHEN** a box selection crosses part of a group frame
- **THEN** the group MUST NOT be selected
- **AND** the member nodes the box touches MUST be selected

#### Scenario: Box enclosing a frame selects the group

- **WHEN** a box selection encloses a whole group frame
- **THEN** the group MUST be selected

### Requirement: Moving a group

Dragging a group by its header or by the empty area of its expanded frame, or dragging a collapsed group card, SHALL move the group rectangle and all of its members by the same offset.

#### Scenario: Drag header moves members

- **WHEN** the user drags a group header by (dx, dy)
- **THEN** the group rectangle and every member node MUST move by (dx, dy)
- **AND** non-member nodes MUST NOT move

#### Scenario: Drag body moves members

- **WHEN** in edit mode the user drags the empty area inside an expanded group frame by (dx, dy)
- **THEN** the group rectangle and every member node MUST move by (dx, dy)
- **AND** the canvas MUST NOT pan

#### Scenario: Drag a collapsed card

- **WHEN** the user drags a collapsed group card by (dx, dy)
- **THEN** every hidden member MUST move by (dx, dy)

#### Scenario: Group and its member selected together

- **WHEN** a group and one of its members are both selected and the user drags the group header by (dx, dy)
- **THEN** that member MUST move by exactly (dx, dy), not twice

#### Scenario: Group dragged together with a free node

- **WHEN** a group and an ungrouped node are selected and dragged together
- **THEN** the group and the node MUST move by the same offset
- **AND** the node MUST join a group if its center ends up inside that group's frame, following the joining rule
