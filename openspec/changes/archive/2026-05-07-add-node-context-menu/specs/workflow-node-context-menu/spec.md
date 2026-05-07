## ADDED Requirements

### Requirement: Workflow nodes expose a context menu
Every workflow node rendered in the canvas SHALL expose a context menu when the user right-clicks the node.

#### Scenario: User opens a node context menu
- **WHEN** a user right-clicks a workflow node
- **THEN** a context menu MUST open for that node
- **AND** the menu MUST include `Copy`, `Duplicate`, and `Delete` commands

#### Scenario: Menu displays keyboard hints
- **WHEN** a node context menu is open
- **THEN** the `Copy` command MUST display the keyboard hint `Ctrl+C`
- **AND** the `Duplicate` command MUST display the keyboard hint `Ctrl+D`
- **AND** the `Delete` command MUST display the keyboard hint `Backspace`

#### Scenario: Delete command is destructive
- **WHEN** a node context menu is open
- **THEN** the `Delete` command MUST use destructive styling
- **AND** the destructive styling MUST render the command in the destructive/red treatment provided by the shared context menu component

### Requirement: Context menu commands target the expected node set
Node context menu commands SHALL operate on the current selected node set when the clicked node is selected, and SHALL operate on only the clicked node when the clicked node is not selected.

#### Scenario: Right-clicking a selected node
- **GIVEN** one or more workflow nodes are selected
- **AND** the user right-clicks a node that is part of the selection
- **WHEN** the user chooses `Copy`, `Duplicate`, or `Delete`
- **THEN** the command MUST apply to all currently selected nodes

#### Scenario: Right-clicking an unselected node
- **GIVEN** one or more workflow nodes are selected
- **AND** the user right-clicks a node that is not part of the selection
- **WHEN** the context menu opens
- **THEN** the workflow selection MUST become only the right-clicked node
- **AND** subsequent context menu commands MUST apply only to that node

### Requirement: Copy command uses existing node clipboard behavior
The node context menu `Copy` command SHALL use the existing selected-node clipboard behavior.

#### Scenario: Copy from context menu
- **GIVEN** the context menu target node set contains at least one node
- **WHEN** the user chooses `Copy`
- **THEN** the workflow MUST write the target node set to the workflow selection clipboard payload
- **AND** the behavior MUST match the existing `Ctrl+C` selected-node copy behavior

### Requirement: Duplicate command clones targeted nodes
The node context menu `Duplicate` command and `Ctrl+D` hotkey SHALL clone the targeted workflow nodes without overwriting the user's system clipboard.

#### Scenario: Duplicate from context menu
- **GIVEN** the context menu target node set contains at least one node
- **WHEN** the user chooses `Duplicate`
- **THEN** the workflow MUST create duplicated nodes with new IDs
- **AND** duplicated nodes MUST be offset from their source nodes
- **AND** duplicated labels and variable references MUST be deduplicated consistently with existing paste behavior
- **AND** internal edges between duplicated nodes MUST be copied to connect the duplicated nodes
- **AND** the duplicated nodes MUST become selected
- **AND** the duplication MUST be undoable in one undo step
- **AND** the system clipboard MUST NOT be modified

#### Scenario: Duplicate with keyboard shortcut
- **GIVEN** one or more workflow nodes are selected
- **WHEN** the user presses `Ctrl+D`
- **THEN** the workflow MUST duplicate the selected nodes with the same behavior as the context menu `Duplicate` command

### Requirement: Delete command removes targeted nodes
The node context menu `Delete` command and `Backspace` hotkey SHALL remove the targeted workflow nodes and their connected edges.

#### Scenario: Delete from context menu
- **GIVEN** the context menu target node set contains at least one node
- **WHEN** the user chooses `Delete`
- **THEN** the workflow MUST remove the targeted nodes
- **AND** the workflow MUST remove edges connected to those nodes
- **AND** the deletion MUST be undoable in one undo step

#### Scenario: Delete with keyboard shortcut
- **GIVEN** one or more workflow nodes are selected
- **WHEN** the user presses `Backspace`
- **THEN** the workflow MUST remove the selected nodes and connected edges

#### Scenario: Delete hotkey while editing text
- **GIVEN** focus is inside an editable field within a workflow node
- **WHEN** the user presses `Backspace`
- **THEN** the workflow MUST NOT delete selected nodes because of that key press
