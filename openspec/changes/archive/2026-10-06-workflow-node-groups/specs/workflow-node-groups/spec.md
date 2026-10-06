## Purpose

Lets users gather related workflow nodes into a named, colored frame on the canvas that can be moved, resized, copied, and collapsed as one piece, without affecting how the workflow executes.

## ADDED Requirements

### Requirement: A group is a named, colored frame with no connections

A node group SHALL have an id, a label, a color, a rectangle (position and size), a collapsed flag, and a set of member nodes. A group SHALL NOT expose connectable ports, SHALL NOT be a source or target of any connection, and SHALL NOT be treated as a workflow node by validation, the node config panel, expression variable scopes, or node counts. Canvas search SHALL treat a group only as described in "Canvas search finds groups by label". Groups SHALL NOT affect workflow execution.

#### Scenario: Group cannot be connected

- **WHEN** a user drags a connection over a group frame or a collapsed group card
- **THEN** no connection to or from the group MUST be created

#### Scenario: Group is not a workflow node

- **WHEN** a workflow contains a group
- **THEN** workflow validation MUST NOT report errors for the group itself
- **AND** selecting the group MUST NOT open the node config panel

### Requirement: Group membership rules

A node SHALL belong to at most one group. Groups SHALL NOT be nested. A group MAY have no members; removing or deleting its last member SHALL keep the group.

#### Scenario: Deleting the last member keeps the group

- **WHEN** the only member node of a group is deleted
- **THEN** the group MUST still exist with no members and the same rectangle

#### Scenario: Dragging out every member keeps the group

- **WHEN** the user drags every member out of a group one by one
- **THEN** the group MUST still exist with no members

### Requirement: Group frame geometry

A group SHALL own its rectangle. Member nodes SHALL keep absolute positions. When a member is moved so that it no longer fits inside the frame, the frame SHALL grow to enclose it. The frame SHALL NOT shrink on its own. The frame SHALL be drawn behind nodes and edges, and its body SHALL NOT block panning, box selection, or clicks on edges and nodes beneath it.

#### Scenario: Frame grows to follow a member

- **WHEN** a member node is dragged past the right edge of its group frame
- **THEN** the frame MUST grow so that it encloses the member while the drag is in progress
- **AND** the move and the growth MUST commit as one history step when the drag ends

#### Scenario: Frame does not shrink on its own

- **WHEN** a member near the frame edge is dragged toward the center of the frame
- **THEN** the frame rectangle MUST stay unchanged

#### Scenario: Panning through a frame body

- **WHEN** the user starts a drag on the body of a group frame, away from its header and member nodes
- **THEN** the canvas MUST pan as it does on an empty area

### Requirement: Resizing a group

In edit mode the user SHALL be able to resize an expanded group by dragging its edges and corners. A non-empty group SHALL NOT be resized smaller than the bounds of its members plus the frame padding and header. An empty group SHALL NOT be resized smaller than a minimum size. A "Fit to contents" action SHALL resize a non-empty group to exactly enclose its members.

#### Scenario: Resize stops at members

- **WHEN** the user drags a frame edge inward past a member node
- **THEN** the frame MUST stop at the member bounds plus padding

#### Scenario: Resizing from the left edge does not move members

- **WHEN** the user drags the left edge of a group frame
- **THEN** only the frame's left edge MUST move
- **AND** member nodes MUST keep their positions
- **AND** the frame's right edge MUST stay fixed, including when the minimum size is reached

#### Scenario: Fit to contents

- **WHEN** the user runs "Fit to contents" on a group whose frame is larger than its members
- **THEN** the frame MUST enclose its members with the standard padding and header and no extra space

### Requirement: Grouping the selection

The editor SHALL let the user create a group from one or more selected nodes through `Mod+G`, the selection toolbar (shown for two or more selected nodes), and the node context menu. Grouping SHALL be available only when every selected node is ungrouped and no group is selected. A new group SHALL enclose the selected nodes, get a default label unique among existing groups and the default color, be expanded, and become selected.

#### Scenario: Group selection with hotkey

- **WHEN** two ungrouped nodes are selected and the user presses `Mod+G`
- **THEN** a new group containing exactly those nodes MUST be created and selected

#### Scenario: Group a single node

- **WHEN** one ungrouped node is selected and the user chooses "Group" in its context menu
- **THEN** a new group containing only that node MUST be created and selected

#### Scenario: Group offered in the selection toolbar

- **WHEN** two or more ungrouped nodes are selected
- **THEN** the selection toolbar MUST offer "Group" and MUST NOT offer "Ungroup"

#### Scenario: Selection includes a grouped node

- **WHEN** the selection contains a node that already belongs to a group
- **THEN** "Group" MUST NOT be offered and `Mod+G` MUST NOT create a group

#### Scenario: Browser shortcut is suppressed

- **WHEN** the user presses `Mod+G` or `Mod+Shift+G` on the canvas
- **THEN** the browser's own action for that shortcut MUST NOT run

#### Scenario: Shortcut on a non-Latin layout

- **WHEN** a Russian keyboard layout is active, two ungrouped nodes are selected, and the user presses `Mod` with the physical `G` key
- **THEN** a new group containing those nodes MUST be created

### Requirement: Selecting groups

Clicking a group header SHALL select the group. Clicking a member node SHALL select the node and not the group. A box selection SHALL select a group only when the box encloses the whole frame; otherwise it SHALL select the nodes it touches as it does today. Groups and nodes SHALL be selectable together with a modifier click.

#### Scenario: Header click selects the group

- **WHEN** the user clicks a group header
- **THEN** the group MUST be selected and its member nodes MUST NOT be selected

#### Scenario: Box touching a frame selects only nodes

- **WHEN** a box selection crosses part of a group frame
- **THEN** the group MUST NOT be selected
- **AND** the member nodes the box touches MUST be selected

#### Scenario: Box enclosing a frame selects the group

- **WHEN** a box selection encloses a whole group frame
- **THEN** the group MUST be selected

### Requirement: Group toolbar and commands

When exactly one group is selected in edit mode, the editor SHALL show a toolbar for it with Copy, Duplicate, Collapse or Expand, Ungroup, and Delete. When groups and ungrouped nodes are selected together, the toolbar SHALL offer Copy, Duplicate, and Delete, which act on whole groups and the selected nodes. When only member nodes of groups are selected, neither "Group" nor "Ungroup" SHALL be offered.

#### Scenario: Selected group toolbar

- **WHEN** one group is selected
- **THEN** the toolbar MUST offer Copy, Duplicate, Collapse (or Expand), Ungroup, and Delete
- **AND** it MUST NOT offer "Group"

#### Scenario: Member nodes selected

- **WHEN** two member nodes of a group are selected
- **THEN** the toolbar MUST NOT offer "Group" or "Ungroup"

#### Scenario: Group context menu

- **WHEN** the user right-clicks a group header or a collapsed group card in edit mode
- **THEN** the group MUST be selected
- **AND** a context menu with the same commands as the group toolbar MUST open

#### Scenario: Keyboard access to a group

- **WHEN** the user moves focus to a group header with `Tab` and presses `Enter`
- **THEN** the group MUST be selected
- **AND** the header MUST expose the group label and member count to assistive technology

### Requirement: Ungrouping

Ungrouping a group SHALL remove the group and leave its member nodes in place with no group. It SHALL be available from the group toolbar and through `Mod+Shift+G` for a selected group.

#### Scenario: Ungroup keeps nodes

- **WHEN** the user ungroups a group with three members
- **THEN** the group MUST be removed
- **AND** the three nodes MUST remain at the same positions with no group

### Requirement: Deleting a group

Deleting a selected group SHALL remove the group together with all of its member nodes and their edges.

#### Scenario: Delete removes group and members

- **WHEN** the user selects a group with three members and presses Delete
- **THEN** the group and its three member nodes MUST be removed

#### Scenario: Delete with a group and one of its members selected

- **WHEN** a group and one of its members are selected together and the user presses Delete
- **THEN** the group and all of its member nodes MUST be removed in one history step

### Requirement: Moving a group

Dragging a group by its header, or dragging a collapsed group card, SHALL move the group rectangle and all of its members by the same offset.

#### Scenario: Drag header moves members

- **WHEN** the user drags a group header by (dx, dy)
- **THEN** the group rectangle and every member node MUST move by (dx, dy)
- **AND** non-member nodes MUST NOT move

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

### Requirement: Joining and leaving a group

When a node drag ends, membership SHALL be resolved from the node's center. If the center lies inside an expanded group frame, the node SHALL become a member of that group; if several frames contain the center, the smallest frame SHALL win. If the node was a member and its center lies outside its group frame, the node SHALL leave the group. A node added from the node palette or by quick-add with its center inside an expanded frame SHALL join that group. Dropping onto a collapsed group card SHALL NOT change membership.

#### Scenario: Drop a node onto a group

- **WHEN** an ungrouped node is dropped with its center inside a group frame
- **THEN** the node MUST become a member of that group

#### Scenario: Drag a node out of its group

- **WHEN** a member node is dropped with its center outside its group frame
- **THEN** the node MUST no longer be a member of that group

#### Scenario: Move a node between groups

- **WHEN** a member of group A is dropped with its center inside group B's frame
- **THEN** the node MUST be a member of group B only

#### Scenario: Add from the palette into a group

- **WHEN** the user drops a node kind from the node palette inside a group frame
- **THEN** the new node MUST be a member of that group

#### Scenario: Drop onto a collapsed card

- **WHEN** an ungrouped node is dropped onto a collapsed group card
- **THEN** the node MUST stay ungrouped

### Requirement: Collapsing a group

A group SHALL be collapsible into a compact card showing its label, color, and member count. While collapsed, members and the edges between members SHALL be hidden; each edge between a member and a non-member SHALL be drawn between the card and the non-member. These card edges SHALL NOT be selectable, deletable, or usable for inserting a node. Expanding SHALL restore the frame with its previous rectangle. Collapsing SHALL deselect any selected members.

#### Scenario: Collapse hides members

- **WHEN** the user collapses a group with three members
- **THEN** the three members MUST NOT be visible
- **AND** a card with the group label and member count 3 MUST be visible

#### Scenario: Boundary edges attach to the card

- **WHEN** a group is collapsed and a non-member node is connected to one of its members
- **THEN** an edge MUST be drawn between the non-member and the card

#### Scenario: Expand restores the frame

- **WHEN** a collapsed group is expanded
- **THEN** its frame MUST have the same rectangle as before it was collapsed
- **AND** its members MUST be visible at their positions

### Requirement: Collapsed state in edit and observe modes

In edit mode, collapsing and expanding SHALL change the workflow: the state SHALL be saved with the workflow and SHALL be undoable. In observe mode, the viewer SHALL be able to collapse and expand groups as a local view override that SHALL NOT change the workflow, SHALL NOT enter history, and SHALL NOT be exported.

#### Scenario: Collapse in edit mode is undoable

- **WHEN** the user collapses a group in edit mode and then undoes
- **THEN** the group MUST be expanded

#### Scenario: Expand in observe mode does not change the workflow

- **WHEN** a viewer expands a saved-collapsed group in observe mode
- **THEN** the group MUST be shown expanded
- **AND** the exported workflow MUST still mark the group as collapsed

### Requirement: Collapsed group summarizes its members

A collapsed group card SHALL show an error indicator when any member has visible validation errors, and in observe mode SHALL show the aggregate runtime status of its members. Revealing a node inside a collapsed group (for example from canvas search) SHALL expand the group before centering the node.

#### Scenario: Validation error on a hidden member

- **WHEN** a member of a collapsed group has a validation error
- **THEN** the card MUST show an error indicator

#### Scenario: Search reveals a hidden member

- **WHEN** the user reveals a search result that is a member of a collapsed group
- **THEN** the group MUST be expanded and the node MUST be centered in the viewport

### Requirement: Canvas search finds groups by label

Canvas search SHALL match the query against each group's label, using the same matching options as node labels. Group label matches SHALL be governed by the labels source filter and counted with it. A group SHALL be ordered among nodes by its frame position, before nodes at the same position. The results panel SHALL list a group match as a group entry showing the group label. The matched label SHALL be marked in the frame header or on the collapsed card. Revealing a group match SHALL center the group header without expanding a collapsed group and SHALL NOT change the selection or create history entries. Members of a collapsed group SHALL remain searchable.

#### Scenario: Search finds a group by its label

- **WHEN** the user searches for "parse" and a group is labeled "Parse response"
- **THEN** the group MUST be listed among the matches and counted in the total
- **AND** the label in the group header MUST be marked

#### Scenario: Labels filter covers group labels

- **WHEN** the labels source filter is disabled
- **THEN** group label matches MUST NOT be listed, counted, or reachable with next and previous

#### Scenario: Revealing a collapsed group keeps it collapsed

- **WHEN** the current match is the label of a collapsed group
- **THEN** the viewport MUST be centered on the group card
- **AND** the group MUST stay collapsed

#### Scenario: Group precedes its members

- **WHEN** both a group label and a member node label match the query
- **THEN** the group match MUST come before the member's match

#### Scenario: Renamed group updates the match set

- **WHEN** search is open and a matching group is renamed so that it no longer matches
- **THEN** the group MUST no longer be listed among the matches

### Requirement: Renaming and recoloring a group

The user SHALL be able to rename a group by double-clicking its header and to change its color by choosing from a fixed palette of color tokens. An empty label after trimming SHALL be rejected and the previous label kept. The frame and card SHALL render each color token legibly in light and dark themes.

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

In edit mode, creating, ungrouping, deleting, renaming, recoloring, moving, resizing, fitting, collapsing, and expanding a group, and membership changes from dragging, SHALL each commit as one history step.

#### Scenario: Undo grouping

- **WHEN** the user groups a selection and then undoes
- **THEN** the group MUST no longer exist and the nodes MUST be ungrouped

#### Scenario: Undo moving a group

- **WHEN** the user drags a group header and then undoes
- **THEN** the group rectangle and all members MUST return to their previous positions in one step

#### Scenario: Undo moving an empty group

- **WHEN** the user drags the header of a group with no members and then undoes
- **THEN** the group rectangle MUST return to its previous position

#### Scenario: Undo deleting a group

- **WHEN** the user deletes a group and then undoes
- **THEN** the group and all of its member nodes and edges MUST be restored in one step

### Requirement: Copy, paste, and duplicate of groups

Copying or duplicating a selected group SHALL copy the group with all of its members. Copying or duplicating nodes that include every member of a group SHALL also copy the group. The copy SHALL get a new id, the same label, color, size, and collapsed state, and SHALL be offset together with its members. Pasted or duplicated nodes whose group was only partially copied SHALL be ungrouped. Copying an empty selected group SHALL copy the empty group.

#### Scenario: Duplicate a selected group

- **WHEN** the user selects group A and duplicates it
- **THEN** a new group with A's label, color, size, and collapsed state and a different id MUST appear with copies of all members

#### Scenario: Paste part of a group

- **WHEN** two of three members of a group are copied and pasted
- **THEN** the pasted nodes MUST NOT belong to any group

### Requirement: Auto-layout with groups

Auto-layout SHALL treat each collapsed group as a single block the size of its card and move its hidden members by the same offset as the block. After layout, every non-empty expanded group frame SHALL be fitted to its members. Empty groups SHALL keep their rectangles.

#### Scenario: Frames follow auto-layout

- **WHEN** auto-layout repositions nodes
- **THEN** each non-empty expanded group frame MUST enclose its members at their new positions

#### Scenario: Collapsed group stays together

- **WHEN** auto-layout runs with a collapsed group
- **THEN** the relative positions of the group's members MUST be unchanged

### Requirement: Groups are read-only in observe mode

In observe mode, groups SHALL be rendered with their labels and colors but SHALL NOT be draggable, resizable, renamable, recolorable, ungroupable, or deletable. Collapsing and expanding SHALL follow the observe-mode override rule.

#### Scenario: Observe mode frame

- **WHEN** the canvas is in observe mode
- **THEN** group frames MUST be visible with their labels and colors
- **AND** group editing controls MUST NOT be available
