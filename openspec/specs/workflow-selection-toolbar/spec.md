# workflow-selection-toolbar Specification

## Purpose
Gives a multi-node selection on the workflow canvas a visible toolbar with copy, duplicate and delete commands. Also keeps the editing hotkeys reachable when the editor is hosted inside a focus-trapping container such as a modal dialog.

## Requirements

### Requirement: Selection toolbar is shown for a multi-node selection
The workflow canvas SHALL render a selection toolbar whenever two or more workflow nodes are selected in edit mode. It SHALL NOT render the toolbar when no node or exactly one node is selected; a single node offers the same commands through its context menu.

#### Scenario: Single node selected
- **WHEN** exactly one workflow node is selected
- **THEN** the selection toolbar MUST NOT be visible
- **AND** the node context menu MUST still offer `Copy`, `Duplicate` and `Delete`

#### Scenario: Several nodes selected
- **WHEN** two or more workflow nodes are selected
- **THEN** exactly one selection toolbar MUST be visible for the whole selection

#### Scenario: Selection shrinks to one node or none
- **GIVEN** the selection toolbar is visible
- **WHEN** the selection becomes a single node or empty
- **THEN** the selection toolbar MUST NOT be visible

### Requirement: Selection toolbar is hidden in observe mode
The selection toolbar SHALL NOT render while the editor runs in observe mode, because every toolbar command mutates or exports the graph from the editing surface.

#### Scenario: Node selected in observe mode
- **GIVEN** the editor runs in observe mode
- **WHEN** two or more workflow nodes are selected
- **THEN** the selection toolbar MUST NOT be visible

### Requirement: Selection toolbar is hidden while dragging
The selection toolbar SHALL NOT render while selected nodes are being dragged. It SHALL reappear when the drag ends and the selection is still non-empty.

#### Scenario: Dragging selected nodes
- **GIVEN** the selection toolbar is visible
- **WHEN** the user starts dragging the selected nodes
- **THEN** the selection toolbar MUST NOT be visible during the drag
- **AND** when the drag ends with two or more nodes still selected the selection toolbar MUST be visible again

### Requirement: Selection toolbar is anchored to the top-right of the selection
The selection toolbar SHALL be placed above the bounding box of all selected nodes, aligned to that box's right edge. It SHALL follow the box when the viewport pans or zooms.

#### Scenario: Toolbar placement for a multi-node selection
- **WHEN** several workflow nodes are selected
- **THEN** the selection toolbar MUST be positioned above the combined bounding box of the selected nodes
- **AND** its right edge MUST align with the right edge of that bounding box

#### Scenario: Viewport changes
- **GIVEN** the selection toolbar is visible
- **WHEN** the user pans or zooms the canvas
- **THEN** the selection toolbar MUST stay anchored to the top-right of the selection bounding box

### Requirement: Selection toolbar offers copy, duplicate and delete
The selection toolbar SHALL offer `Copy`, `Duplicate` and `Delete` commands. They SHALL apply to all currently selected nodes and SHALL behave exactly like the node context menu commands and the `Ctrl+C`, `Ctrl+D` and `Backspace` hotkeys with the same selection.

#### Scenario: Copy from toolbar
- **GIVEN** two or more workflow nodes are selected
- **WHEN** the user activates the toolbar `Copy` button
- **THEN** the workflow MUST write the selected nodes to the workflow selection clipboard payload
- **AND** the result MUST match the `Ctrl+C` selected-node copy behavior

#### Scenario: Duplicate from toolbar
- **GIVEN** two or more workflow nodes are selected
- **WHEN** the user activates the toolbar `Duplicate` button
- **THEN** the workflow MUST duplicate the selected nodes exactly as the node context menu `Duplicate` command does
- **AND** the duplicated nodes MUST become selected

#### Scenario: Delete from toolbar
- **GIVEN** two or more workflow nodes are selected
- **WHEN** the user activates the toolbar `Delete` button
- **THEN** the workflow MUST delete the selected nodes exactly as the node context menu `Delete` command does
- **AND** the selection toolbar MUST NOT be visible afterwards
- **AND** keyboard focus MUST return to the canvas so the editing hotkeys (for example `Ctrl+Z`) keep working

#### Scenario: Delete uses destructive styling
- **WHEN** the selection toolbar is visible
- **THEN** the `Delete` button MUST use the destructive treatment
- **AND** it MUST be visually separated from `Copy` and `Duplicate`

#### Scenario: Toolbar interaction does not change the selection
- **GIVEN** several workflow nodes are selected
- **WHEN** the user presses a selection toolbar button
- **THEN** pressing the button MUST NOT deselect nodes or start a canvas pan or node drag

### Requirement: Selection toolbar commands match the node context menu
The selection toolbar and the node context menu SHALL expose the same set of selection commands with the same labels and keyboard hints.

#### Scenario: Labels and hints are consistent
- **WHEN** the user compares the selection toolbar with an open node context menu
- **THEN** both MUST list `Copy`, `Duplicate` and `Delete`
- **AND** both MUST show the same keyboard hint for each command

### Requirement: Selection toolbar buttons have accessible names and tooltips
Each selection toolbar button SHALL have an accessible name equal to its command label. Each button SHALL show a tooltip with the command label and its keyboard hint on hover and on keyboard focus.

#### Scenario: Hovering a toolbar button
- **WHEN** the user hovers the toolbar `Copy` button
- **THEN** a tooltip MUST show `Copy` together with the hint `Ctrl+C`

#### Scenario: Screen reader name
- **WHEN** assistive technology inspects the toolbar buttons
- **THEN** the buttons MUST expose the accessible names `Copy`, `Duplicate` and `Delete`

### Requirement: Canvas takes keyboard focus on pointer interaction
A pointer interaction with a workflow node or with the empty canvas SHALL move keyboard focus onto the canvas, unless the interaction targets an editable field or another focusable control. The editing hotkeys then work even when the editor is hosted in a focus-trapping container.

#### Scenario: Selecting a node inside a focus-trapping dialog
- **GIVEN** the editor is rendered inside a modal dialog that traps focus
- **AND** keyboard focus was previously in a text input of the node config panel
- **WHEN** the user clicks a workflow node on the canvas
- **AND** presses `Ctrl+C`
- **THEN** the selected node MUST be copied to the workflow selection clipboard payload

#### Scenario: Clicking the empty canvas
- **GIVEN** keyboard focus is in a text input outside the canvas
- **WHEN** the user clicks the empty canvas
- **THEN** keyboard focus MUST move onto the canvas

#### Scenario: Clicking an editable field inside a node
- **WHEN** the user clicks a text input or expression editor rendered inside a workflow node
- **THEN** keyboard focus MUST go to that field and MUST NOT be moved onto the canvas
