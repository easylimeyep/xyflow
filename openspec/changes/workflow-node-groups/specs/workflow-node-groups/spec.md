## Purpose

Lets users visually group related workflow nodes into a named, colored frame on the canvas without affecting how the workflow executes.

## ADDED Requirements

### Requirement: A group is a named, colored frame with no connections

A node group SHALL have an id, a label, a color, and a set of member nodes. A group SHALL NOT expose ports, SHALL NOT be a source or target of any connection, and SHALL NOT be treated as a workflow node by validation, the node config panel, expression variable scopes, or node counts.

#### Scenario: Group cannot be connected

- **WHEN** a user drags a connection over a group frame
- **THEN** no connection to or from the group MUST be created

#### Scenario: Group is not a workflow node

- **WHEN** a workflow contains a group
- **THEN** workflow validation MUST NOT report errors for the group
- **AND** selecting the group MUST NOT open the node config panel

### Requirement: Group membership rules

A node SHALL belong to at most one group. Groups SHALL NOT be nested. A group SHALL always have at least one member; when its last member leaves or is deleted, the group SHALL be removed.

#### Scenario: Grouping a node that is already in another group moves it

- **WHEN** the user groups a selection that includes a node from group A
- **THEN** that node MUST be a member of the new group only
- **AND** group A MUST keep its remaining members

#### Scenario: Deleting the last member removes the group

- **WHEN** the only member node of a group is deleted
- **THEN** the group MUST no longer exist

#### Scenario: Group cannot be a member of a group

- **WHEN** the user groups a selection that contains a group frame
- **THEN** the resulting group's members MUST be nodes only (the selected group's members join the new group and the selected group is removed)

### Requirement: Group frame auto-fits its members

A group's frame SHALL be derived from the bounds of its member nodes plus a fixed padding and a header area. A group SHALL NOT store its own position or size. The frame SHALL be drawn behind nodes and edges.

#### Scenario: Frame follows a moved member

- **WHEN** a member node is dragged within its group
- **THEN** the frame MUST resize to enclose all members, including the moved one

#### Scenario: Frame follows auto-layout

- **WHEN** auto-layout repositions nodes
- **THEN** each group frame MUST enclose its members at their new positions

### Requirement: Grouping the selection

The editor SHALL let the user create a group from the current node selection through a hotkey (`Mod+G`) and through the node context menu. A new group SHALL get a default label unique among existing groups and the default color, and SHALL become selected.

#### Scenario: Group selection with hotkey

- **WHEN** two or more nodes are selected and the user presses `Mod+G`
- **THEN** a new group containing exactly the selected nodes MUST be created

#### Scenario: Group a single node from the context menu

- **WHEN** the user opens the context menu on one node and chooses "Group"
- **THEN** a new group containing that node MUST be created

#### Scenario: Nothing selected

- **WHEN** no node is selected and the user presses `Mod+G`
- **THEN** no group MUST be created

### Requirement: Ungrouping

The editor SHALL let the user ungroup a group from the group header and through the node context menu of any member (`Mod+Shift+G` for a selected group). Ungrouping SHALL remove the group and leave its member nodes in place.

#### Scenario: Ungroup keeps nodes

- **WHEN** the user ungroups a group with three members
- **THEN** the group MUST be removed
- **AND** the three nodes MUST remain at the same positions with no group

### Requirement: Moving a group

Dragging a group by its header SHALL move all of its members by the same offset.

#### Scenario: Drag header moves members

- **WHEN** the user drags a group header by (dx, dy)
- **THEN** every member node MUST move by (dx, dy)
- **AND** non-member nodes MUST NOT move

### Requirement: Joining and leaving a group by dragging

When a node drag ends, membership SHALL be resolved from the node's center: if the center lies inside the frame of another group (computed without the dragged node), the node SHALL join that group; if the node was in a group and its center lies outside that group's frame computed from the remaining members, the node SHALL leave the group. A group's only member SHALL NOT leave by dragging.

#### Scenario: Drop a node onto a group

- **WHEN** an ungrouped node is dropped with its center inside a group's frame
- **THEN** the node MUST become a member of that group

#### Scenario: Drag a node out of its group

- **WHEN** a member node is dropped with its center outside the frame of the group's other members
- **THEN** the node MUST no longer be a member of that group

#### Scenario: Move a node from one group to another

- **WHEN** a member of group A is dropped with its center inside group B's frame
- **THEN** the node MUST be a member of group B only

### Requirement: Renaming and recoloring a group

The user SHALL be able to rename a group by double-clicking its header and to change its color by choosing from a fixed palette of color tokens. An empty label after trimming SHALL be rejected and the previous label kept. The frame SHALL render each color token legibly in light and dark themes.

#### Scenario: Rename by double-click

- **WHEN** the user double-clicks a group header, types "Parse response" and confirms
- **THEN** the group label MUST be "Parse response"

#### Scenario: Empty rename is rejected

- **WHEN** the user clears the label and confirms
- **THEN** the group MUST keep its previous label

#### Scenario: Change color

- **WHEN** the user picks the "green" token in the group color picker
- **THEN** the group color MUST be "green"

### Requirement: Group edits are undoable

Creating, ungrouping, renaming, recoloring, moving a group, and membership changes from dragging SHALL each commit as one history step.

#### Scenario: Undo grouping

- **WHEN** the user groups a selection and then undoes
- **THEN** the group MUST no longer exist and the nodes MUST be ungrouped

#### Scenario: Undo moving a group

- **WHEN** the user drags a group header and then undoes
- **THEN** all members MUST return to their previous positions in one step

### Requirement: Groups survive copy, paste, and duplicate of whole groups

When copied or duplicated nodes include every member of a group, the pasted or duplicated nodes SHALL form a new group with a new id, the same label, and the same color. Pasted or duplicated nodes whose group was only partially copied SHALL be ungrouped.

#### Scenario: Duplicate a whole group

- **WHEN** all members of group A are duplicated
- **THEN** the duplicates MUST form a new group with A's label and color and a different id

#### Scenario: Paste part of a group

- **WHEN** two of three members of a group are copied and pasted
- **THEN** the pasted nodes MUST NOT belong to any group

### Requirement: Groups are read-only in observe mode

In observe mode, group frames SHALL be rendered but SHALL NOT be draggable, renamable, recolorable, or ungroupable.

#### Scenario: Observe mode frame

- **WHEN** the canvas is in observe mode
- **THEN** group frames MUST be visible with their labels and colors
- **AND** group editing controls MUST NOT be available
