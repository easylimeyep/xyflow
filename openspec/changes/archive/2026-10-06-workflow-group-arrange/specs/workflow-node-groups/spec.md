# Spec Delta

## MODIFIED Requirements

### Requirement: Resizing a group

In edit mode the user SHALL be able to resize an expanded group by dragging its edges and corners. A non-empty group SHALL NOT be resized smaller than the bounds of its members plus the frame padding and header. An empty group SHALL NOT be resized smaller than a minimum size. Fitting a frame tightly to its members SHALL be done by the "Arrange" action, which lays the members out first.

#### Scenario: Resize stops at members

- **WHEN** the user drags a frame edge inward past a member node
- **THEN** the frame MUST stop at the member bounds plus padding

#### Scenario: Resizing from the left edge does not move members

- **WHEN** the user drags the left edge of a group frame
- **THEN** only the frame's left edge MUST move
- **AND** member nodes MUST keep their positions
- **AND** the frame's right edge MUST stay fixed, including when the minimum size is reached

#### Scenario: Fit to contents

- **WHEN** the user runs "Arrange" on a group whose frame is larger than its members
- **THEN** after the layout the frame MUST enclose its members with the standard padding and header and no extra space

## ADDED Requirements

### Requirement: Arranging a group

In edit mode an expanded group with at least one member SHALL offer an "Arrange" action in its header. Arrange SHALL lay out the group's members with the editor's auto-layout rules, using only the edges whose both ends are members of that group, and then fit the frame to exactly enclose the members with the standard padding and header and no extra space. The arranged members SHALL start at the top-left corner of the members' bounds before Arrange. Nodes outside the group, and other groups, SHALL NOT move. Arrange SHALL run only when the user invokes it and SHALL be undoable as a single step. If the layout fails, the graph SHALL stay unchanged and the editor SHALL report the error.

#### Scenario: Arrange lays out members along their connections

- **WHEN** a group holds three members connected in a chain A → B → C, placed out of order, and the user presses "Arrange"
- **THEN** the members MUST be laid out left to right in the order A, B, C
- **AND** no two members MUST overlap

#### Scenario: Arrange keeps the group in place

- **WHEN** the user presses "Arrange"
- **THEN** the top-left corner of the members' bounds MUST be the same as before Arrange

#### Scenario: Nodes outside the group stay put

- **WHEN** the user presses "Arrange" on a group and a member is connected to a node outside the group
- **THEN** the outside node and every other node not in the group MUST keep its position
- **AND** other groups' frames MUST keep their rectangles

#### Scenario: Arrange is undoable in one step

- **WHEN** the user presses "Arrange" and then undoes once
- **THEN** every member position and the frame rectangle MUST return to their values before Arrange

#### Scenario: Adding a node does not arrange the group

- **WHEN** the user drags, pastes, or adds a node into a group
- **THEN** the other members MUST keep their positions

#### Scenario: Arrange is not offered for an empty group

- **WHEN** an expanded group has no members
- **THEN** the "Arrange" action MUST be disabled

#### Scenario: Arrange is not offered in observe mode

- **WHEN** the canvas is in observe mode
- **THEN** the group header MUST NOT offer "Arrange"

#### Scenario: Layout failure leaves the group unchanged

- **WHEN** the layout of a group's members fails
- **THEN** member positions and the frame rectangle MUST stay unchanged
- **AND** the editor MUST report an auto-layout error
