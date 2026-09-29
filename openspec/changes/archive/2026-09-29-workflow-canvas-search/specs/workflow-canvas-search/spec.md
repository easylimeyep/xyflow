# Spec Delta

## Purpose

Lets users find node labels, variable definitions, and variable references on the workflow canvas and step through every occurrence the way a code editor's find bar does.

## ADDED Requirements

### Requirement: Canvas search matches occurrences across labels and variables

The workflow editor SHALL provide a canvas search that matches a non-empty query against three occurrence sources in every node:
- the node label;
- the variable name the node defines, if its kind defines one;
- each variable reference inside a `{{…}}` expression segment of the node's expression fields, covering the same fields that variable rename updates.

Matching SHALL be case-insensitive substring matching. Each occurrence SHALL count as a separate match, so a single node MAY contribute several matches. Text outside `{{…}}` segments in expression fields SHALL NOT produce matches. A query that is empty or contains only whitespace SHALL produce no matches.

#### Scenario: One node contributes several matches

- **WHEN** a node labeled "Calc price" defines the variable `price`
- **AND** the user searches for "price"
- **THEN** the search SHALL report two matches for that node, one for the label and one for the variable definition

#### Scenario: Variable references are counted per occurrence

- **WHEN** one node defines `price`
- **AND** two other nodes reference `{{price}}` in their expression fields, one of them twice
- **AND** the user searches for "price"
- **THEN** the search SHALL report four matches: the definition plus three references

#### Scenario: Matching ignores case

- **WHEN** a node is labeled "Parse Response"
- **AND** the user searches for "parse response"
- **THEN** the label SHALL be reported as a match

#### Scenario: Literal text outside expressions does not match

- **WHEN** an expression field contains the literal text `price: {{amount}}`
- **AND** the user searches for "price"
- **THEN** that field SHALL contribute no match

#### Scenario: Empty query

- **WHEN** the search query is empty or contains only whitespace
- **THEN** the search SHALL report no matches
- **AND** no node SHALL be marked as a match

### Requirement: Matches are ordered by canvas position

The search SHALL order matches spatially:
- nodes top-to-bottom by position;
- nodes at the same vertical position left-to-right;
- within a node: the label first, then the variable definition, then references in field order and text order.

#### Scenario: Upper node comes first

- **WHEN** node A sits above node B on the canvas and both match the query
- **THEN** every match in node A SHALL precede every match in node B, regardless of the order in which the nodes were created

### Requirement: Search shows a match counter and supports next and previous navigation

The search bar SHALL show the current match position and the total as `N / M`. With a non-empty query and no matches it SHALL show a zero-results state. The user SHALL be able to move to the next match (next button or `Enter` in the search input) and to the previous match (previous button or `Shift+Enter`). Navigation SHALL wrap from the last match to the first and from the first to the last. When a query first yields matches, the current match SHALL be the first match.

#### Scenario: Counter reflects position

- **WHEN** a query yields 7 matches and the user moves to the third match
- **THEN** the search bar SHALL display `3 / 7`

#### Scenario: Next wraps around

- **WHEN** the current match is the last match
- **AND** the user moves to the next match
- **THEN** the current match SHALL become the first match

#### Scenario: Previous wraps around

- **WHEN** the current match is the first match
- **AND** the user moves to the previous match
- **THEN** the current match SHALL become the last match

#### Scenario: No results

- **WHEN** the query is non-empty and yields no matches
- **THEN** the search bar SHALL indicate that there are no results
- **AND** the next and previous controls SHALL be disabled

### Requirement: Moving to a match reveals its node without changing selection

When the current match changes, the editor SHALL center the viewport on the node that holds the current match. If the current zoom is below a minimum readable level, the editor SHALL raise the zoom to that level, within the workflow zoom bounds. Otherwise the current zoom SHALL be kept.

Moving between matches SHALL NOT change the node selection and SHALL NOT create undo history entries. The search SHALL provide an explicit action that selects the node holding the current match.

#### Scenario: Viewport follows the current match

- **WHEN** the user moves to a match in a node that is outside the visible viewport
- **THEN** the viewport SHALL center on that node

#### Scenario: Zoom is raised only when too far out

- **WHEN** the current zoom is below the minimum readable level
- **AND** the user moves to a match
- **THEN** the viewport zoom SHALL be raised to the minimum readable level
- **AND** when the current zoom is already at or above that level, it SHALL be kept

#### Scenario: Navigation keeps selection and history intact

- **WHEN** node X is selected
- **AND** the user steps through matches in other nodes
- **THEN** node X SHALL remain the only selected node
- **AND** the undo history SHALL be unchanged

#### Scenario: Selecting the current match node

- **WHEN** the user triggers the select action on the current match
- **THEN** the node holding the current match SHALL become the selected node

### Requirement: Matching nodes are marked on the canvas

While search has matches, every node with at least one match SHALL be visibly marked. The node holding the current match SHALL carry a distinct, stronger mark. Nodes without matches SHALL render as usual. Closing the search or clearing the query SHALL remove all marks.

Changes to search state SHALL NOT re-render nodes whose match status did not change.

#### Scenario: Current and other matches look different

- **WHEN** a query matches nodes A and B and the current match is in A
- **THEN** A SHALL show the current-match mark
- **AND** B SHALL show the match mark

#### Scenario: Marks are removed on close

- **WHEN** the user closes the search
- **THEN** no node SHALL show a match or current-match mark

#### Scenario: Unaffected nodes do not re-render

- **WHEN** the current match moves from one match to another within the same node
- **THEN** nodes whose match status did not change SHALL NOT re-render

### Requirement: Matches stay in sync with graph edits

While search is open, the match list SHALL be recomputed whenever the graph changes: nodes are added, removed, or moved, labels are edited, or configuration is edited. The current match SHALL be kept by identity: the same node, source, field, and occurrence. If the current match no longer exists, the current match SHALL become the nearest following match in the new order. If there is none, it SHALL become the first match. If no matches remain, the search SHALL show the zero-results state.

#### Scenario: Edits elsewhere do not shift the current match

- **WHEN** the current match is the definition of `price` in node A, displayed as `3 / 7`
- **AND** the user adds a new reference to `{{price}}` in a node placed below A
- **THEN** the current match SHALL still be the definition of `price` in node A
- **AND** the counter SHALL display `3 / 8`

#### Scenario: Current match is removed

- **WHEN** the node holding the current match is deleted
- **THEN** the current match SHALL move to the nearest following match
- **AND** the counter SHALL reflect the new total

### Requirement: Search opens with a scoped hotkey in edit and observe modes

The search SHALL open and focus its input when the user presses `Mod+F` (`Cmd+F` on macOS, `Ctrl+F` elsewhere) while focus is inside the workflow editor. `Mod+F` pressed outside the workflow editor SHALL keep the browser's default behavior. Pressing `Mod+F` while the search is already open SHALL focus and select the query. `Escape` in the search input SHALL close the search. Search SHALL be available in both edit and observe modes.

#### Scenario: Hotkey inside the editor

- **WHEN** focus is on the workflow canvas and the user presses `Mod+F`
- **THEN** the search bar SHALL open with its input focused
- **AND** the browser's own find SHALL NOT open

#### Scenario: Hotkey outside the editor

- **WHEN** focus is outside the workflow editor and the user presses `Mod+F`
- **THEN** the workflow search SHALL NOT open

#### Scenario: Escape closes search

- **WHEN** the search input is focused and the user presses `Escape`
- **THEN** the search SHALL close and all match marks SHALL be removed

#### Scenario: Available in observe mode

- **WHEN** the editor is in observe mode
- **AND** the user presses `Mod+F` inside the editor
- **THEN** the search SHALL open and navigate matches as in edit mode

### Requirement: Search is a public composable editor part

The search bar SHALL be included in the default editor composition. It SHALL be exposed as `WorkflowEditor.Search` and as a named export from the flow package. It SHALL bind to the mounted workflow store like the other editor parts.

#### Scenario: Default composition includes search

- **WHEN** a consumer renders `WorkflowEditor` without children
- **THEN** the canvas search SHALL be available through its hotkey

#### Scenario: Custom composition opts in

- **WHEN** a consumer renders a custom composition that includes `WorkflowEditor.Canvas` and `WorkflowEditor.Search`
- **THEN** the search SHALL find and reveal matches on that canvas
