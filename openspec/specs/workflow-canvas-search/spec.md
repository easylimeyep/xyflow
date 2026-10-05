# workflow-canvas-search Specification

## Purpose
Lets users find node labels, variable definitions, and variable references on the workflow canvas and step through every occurrence the way a code editor's find bar does.

## Requirements

### Requirement: Canvas search matches occurrences across labels and variables

The workflow editor SHALL provide a canvas search that matches a non-empty query against three occurrence sources in every node:
- the node label;
- the variable name the node defines, if its kind defines one and holds that name in a field of its own;
- each variable reference inside a `{{…}}` expression segment of the node's expression fields, covering the same fields that variable rename updates.

When a node's variable name is taken from its label rather than from a field of its own, the label match SHALL be the only match for that text; the search SHALL NOT report a separate variable-definition match for it.

By default, matching SHALL be case-insensitive substring matching. The search SHALL offer two matching options, both off by default:
- **match case**: when on, an occurrence SHALL match only with the same letter case as the query;
- **whole word**: when on, an occurrence SHALL match only when neither the character before it nor the character after it is an identifier character (a letter, a digit, `_` or `$`).

Each occurrence SHALL count as a separate match, so a single node MAY contribute several matches. Text outside `{{…}}` segments in expression fields SHALL NOT produce matches. A query that is empty or contains only whitespace SHALL produce no matches.

#### Scenario: One node contributes several matches

- **WHEN** a node labeled "Calc price" holds the variable name `price` in its variable-name field
- **AND** the user searches for "price"
- **THEN** the search SHALL report two matches for that node, one for the label and one for the variable definition

#### Scenario: Variable name taken from the label is not reported twice

- **WHEN** a node's kind takes its variable name from the node label
- **AND** the node is labeled "price"
- **AND** the user searches for "price"
- **THEN** the search SHALL report exactly one match for that node, for the label

#### Scenario: Variable references are counted per occurrence

- **WHEN** one node defines `price`
- **AND** two other nodes reference `{{price}}` in their expression fields, one of them twice
- **AND** the user searches for "price"
- **THEN** the search SHALL report four matches: the definition plus three references

#### Scenario: Matching ignores case

- **WHEN** a node is labeled "Parse Response"
- **AND** the user searches for "parse response" with match case off
- **THEN** the label SHALL be reported as a match

#### Scenario: Match case

- **WHEN** a node is labeled "Parse Response"
- **AND** the user searches for "parse response" with match case on
- **THEN** the label SHALL NOT be reported as a match

#### Scenario: Whole word skips longer identifiers

- **WHEN** one expression field references `{{rate}}` and another references `{{max_rate}}`
- **AND** the user searches for "rate" with whole word on
- **THEN** only the reference to `rate` SHALL be reported as a match

#### Scenario: Whole word accepts property access

- **WHEN** an expression field references `{{rate.value}}`
- **AND** the user searches for "rate" with whole word on
- **THEN** that reference SHALL be reported as a match

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

The counter SHALL be a control that expands and collapses the results panel, reachable by keyboard and announcing whether the panel is expanded. Changes to the counter's value SHALL be announced to assistive technology without moving focus.

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

#### Scenario: Counter toggles the results panel

- **WHEN** the results panel is collapsed and the user activates the counter
- **THEN** the results panel SHALL expand
- **AND** activating the counter again SHALL collapse it

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

While search has matches, every node with at least one match SHALL be visibly marked, and every visible field holding a match SHALL be visibly marked:
- a label match marks the node title;
- a variable-definition match marks the field holding the variable name;
- a reference match marks the expression field holding it. When that field is not shown directly (a collapsed list of values), the control that opens it SHALL carry the mark.

The field holding the current match SHALL carry a distinct, stronger mark than other matched fields, so that moving between two matches in the same node visibly moves the mark. The node holding the current match SHALL carry a mark that tells it apart from other matching nodes, and that mark SHALL be visible when the canvas is zoomed out too far to read fields. When the current match has no field of its own to mark, the node itself SHALL carry the strong current-match mark.

Nodes and fields without matches SHALL render as usual. Closing the search or clearing the query SHALL remove all marks.

Changes to search state SHALL NOT re-render nodes whose match status did not change, and SHALL NOT re-render fields whose match status did not change.

#### Scenario: Current and other matches look different

- **WHEN** a query matches nodes A and B and the current match is in A
- **THEN** A SHALL show the current-node mark
- **AND** B SHALL show the match mark

#### Scenario: The mark moves between matches in one node

- **WHEN** a node labeled "Calc price" holds the variable name `price`
- **AND** the current match is the label match
- **AND** the user moves to the next match, the variable definition in the same node
- **THEN** the strong current-match mark SHALL move from the node title to the variable-name field
- **AND** the node title SHALL show the match mark

#### Scenario: Reference fields are marked individually

- **WHEN** a node has two expression fields and only the second references `{{price}}`
- **AND** the user searches for "price"
- **THEN** the second field SHALL be marked
- **AND** the first field SHALL render as usual

#### Scenario: Reference in a collapsed list of values

- **WHEN** the current match is a reference inside a list of operand values that is shown collapsed
- **THEN** the control that opens that list SHALL carry the current-match mark

#### Scenario: Marks are removed on close

- **WHEN** the user closes the search
- **THEN** no node and no field SHALL show a match or current-match mark

#### Scenario: Unaffected nodes do not re-render

- **WHEN** the current match moves from one match to another within the same node
- **THEN** nodes whose match status did not change SHALL NOT re-render

#### Scenario: Unaffected fields do not re-render

- **WHEN** the current match moves from one field to another
- **THEN** only the two fields whose status changed SHALL re-render

### Requirement: Matches stay in sync with graph edits

While search is open, the match list SHALL be recomputed whenever the graph changes: nodes are added, removed, or moved, labels are edited, or configuration is edited. The current match SHALL be kept by identity: the same node, source, field, and occurrence. A field's identity SHALL NOT depend on the position of other entries in the same node's configuration: a reference inside an evaluator condition is identified by that condition and operand, not by its index among the node's conditions. If the current match no longer exists, the current match SHALL become the nearest following match in the new order. If there is none, it SHALL become the first match. If no matches remain, the search SHALL show the zero-results state.

#### Scenario: Edits elsewhere do not shift the current match

- **WHEN** the current match is the definition of `price` in node A, displayed as `3 / 7`
- **AND** the user adds a new reference to `{{price}}` in a node placed below A
- **THEN** the current match SHALL still be the definition of `price` in node A
- **AND** the counter SHALL display `3 / 8`

#### Scenario: Current match is removed

- **WHEN** the node holding the current match is deleted
- **THEN** the current match SHALL move to the nearest following match
- **AND** the counter SHALL reflect the new total

#### Scenario: Removing an earlier condition keeps the current match

- **WHEN** the current match is a reference in the second condition of an evaluator
- **AND** the user deletes the first condition of that evaluator
- **THEN** the current match SHALL still be the same reference in the same condition

### Requirement: Search opens with a scoped hotkey in edit and observe modes

The search SHALL open and focus its input when the user presses `Mod+F` (`Cmd+F` on macOS, `Ctrl+F` elsewhere) while focus is inside the workflow editor. `Mod+F` pressed outside the workflow editor SHALL keep the browser's default behavior. Pressing `Mod+F` while the search is already open SHALL focus and select the query. `Escape` in the search input SHALL close the search. Search SHALL be available in both edit and observe modes.

When `Mod+F` is pressed while the focused element inside the editor holds a usable text selection, the search query SHALL be set to the selected text before the search opens or, if it is already open, before its query is focused and selected. This SHALL apply to text inputs, text areas and content-editable fields such as expression fields. A selection is usable when it is non-empty, contains a non-whitespace character and spans a single line. The selected text SHALL be used as is, without trimming or removing expression delimiters. A selection that is not usable SHALL leave the query unchanged. A selection inside the search bar's own query input SHALL NOT change the query.

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

#### Scenario: Selection in an expression field seeds the query

- **WHEN** the search is closed
- **AND** the user selects `price` inside an expression field and presses `Mod+F`
- **THEN** the search SHALL open with the query `price`
- **AND** the search input SHALL be focused with its query selected

#### Scenario: Selection in a text input seeds the query

- **WHEN** the search is closed
- **AND** the user selects `Calc` in a node label input and presses `Mod+F`
- **THEN** the search SHALL open with the query `Calc`

#### Scenario: Selection replaces the query of an open search

- **WHEN** the search is open with the query `rate`
- **AND** the user selects `price` inside an expression field and presses `Mod+F`
- **THEN** the query SHALL become `price`
- **AND** the search input SHALL be focused with its query selected

#### Scenario: No selection keeps the query

- **WHEN** the search is open with the query `rate`
- **AND** the caret is in an expression field with no text selected
- **AND** the user presses `Mod+F`
- **THEN** the query SHALL stay `rate`
- **AND** the search input SHALL be focused with its query selected

#### Scenario: Whitespace-only or multi-line selection is ignored

- **WHEN** the selected text is only whitespace or spans more than one line
- **AND** the user presses `Mod+F`
- **THEN** the query SHALL stay unchanged

#### Scenario: Selected text is used as is

- **WHEN** the user selects `{{ price }}` inside an expression field and presses `Mod+F`
- **THEN** the query SHALL be `{{ price }}`

#### Scenario: Selection inside the search input does not seed

- **WHEN** the search is open with the query `price total`
- **AND** the user selects `total` inside the search input and presses `Mod+F`
- **THEN** the query SHALL stay `price total`
- **AND** the whole query SHALL be selected

### Requirement: Search is a public composable editor part

The search bar SHALL be included in the default editor composition. It SHALL be exposed as `WorkflowEditor.Search` and as a named export from the flow package. It SHALL bind to the mounted workflow store like the other editor parts.

#### Scenario: Default composition includes search

- **WHEN** a consumer renders `WorkflowEditor` without children
- **THEN** the canvas search SHALL be available through its hotkey

#### Scenario: Custom composition opts in

- **WHEN** a consumer renders a custom composition that includes `WorkflowEditor.Canvas` and `WorkflowEditor.Search`
- **THEN** the search SHALL find and reveal matches on that canvas

### Requirement: Search offers an expandable results panel

The search bar SHALL offer a results panel, attached below the bar, that lists the current match set. The panel SHALL be expanded and collapsed only by its toggle, and SHALL be hidden whenever the search is closed. It SHALL stay expanded while the user interacts with the canvas, edits the graph, or picks a result. Its expanded state SHALL persist across closing and reopening the search within the same editor.

The panel's height SHALL be bounded, and its content SHALL scroll. With an empty query, the expanded panel SHALL show a hint instead of a list.

#### Scenario: Panel survives canvas interaction

- **WHEN** the results panel is expanded
- **AND** the user clicks the canvas, selects a node, or edits a node's configuration
- **THEN** the results panel SHALL remain expanded

#### Scenario: Panel state persists across reopening

- **WHEN** the results panel is expanded and the user closes the search
- **AND** the user opens the search again
- **THEN** the results panel SHALL be expanded

#### Scenario: Closed search hides the panel

- **WHEN** the user closes the search
- **THEN** the results panel SHALL NOT be shown

#### Scenario: List follows graph edits

- **WHEN** the results panel is expanded
- **AND** the user adds a node whose label matches the query
- **THEN** the panel SHALL list the new match in its canvas-order position

### Requirement: Results are grouped by node with running numbers

The results panel SHALL group matches by node. Groups SHALL appear in the order of each node's first match in the current match set, which follows canvas order. A group header SHALL show:
- the node kind's icon;
- the node label;
- the node kind's title;
- the number of matches in that node.

A group header SHALL NOT be selectable.

Each match row SHALL show:
- the match's one-based position in the current match set, equal to the `N` the counter shows when that match is current;
- a readable name for where the match sits;
- a snippet of the matched text with the matched characters highlighted.

The readable name SHALL be:
- "Label" for a label match;
- the variable-name field's label for a variable-definition match;
- for a reference match, the expression field's label, with a one-based entry number for an entry of a list of values;
- for a reference in a nested structure, the description the node kind provides, or a generic "Expression" name when the kind provides none.

A snippet SHALL show a bounded window of text around the match. It SHALL mark text cut at either end with an ellipsis.

#### Scenario: Grouped rows keep the counter's numbering

- **WHEN** a query yields 26 matches, with matches 14 and 15 in node "Extract rate"
- **THEN** the panel SHALL show one group for "Extract rate" with a count of 2
- **AND** its rows SHALL be numbered 14 and 15

#### Scenario: Entry of a list of values

- **WHEN** a match is a reference in the second entry of a list-of-values field labeled "Tokens"
- **THEN** its row SHALL name the field "Tokens #2"

#### Scenario: Nested operand described by its kind

- **WHEN** a match is a reference in the left operand of an evaluator's second condition
- **THEN** its row SHALL name the field after that condition and operand, for example "Condition 2 · Left operand"

#### Scenario: Snippet highlights the match

- **WHEN** a match is a reference to `rate` in the template `{{ max(rate, 10) }}`
- **THEN** the row snippet SHALL contain that text with `rate` highlighted

### Requirement: Picking a result navigates to it

Picking a match row, by pointer or by keyboard, SHALL make that match the current match. This SHALL reveal its node exactly as stepping to it with next or previous would: it SHALL NOT change the node selection and SHALL NOT create undo history entries. After a pick, the panel SHALL remain expanded.

The panel's active row SHALL follow the current match: when the current match changes by any means, the corresponding row SHALL be indicated as current and scrolled into view. Moving keyboard focus between rows SHALL NOT change the current match and SHALL NOT move the viewport.

With the panel expanded and focus in the search input, `ArrowDown` SHALL move focus to the current match's row. `Escape` pressed within the panel SHALL return focus to the search input and SHALL NOT close the search.

#### Scenario: Clicking a row jumps to the match

- **WHEN** the current match is `3 / 26`
- **AND** the user clicks the row numbered 17
- **THEN** the counter SHALL display `17 / 26`
- **AND** the viewport SHALL center on the node holding match 17
- **AND** the node selection and the undo history SHALL be unchanged

#### Scenario: Keyboard focus does not navigate

- **WHEN** focus is on a row in the results panel
- **AND** the user presses `ArrowDown` to focus the next row
- **THEN** the current match and the viewport SHALL be unchanged
- **AND** pressing `Enter` SHALL make the focused row's match current

#### Scenario: Stepping from the input moves the active row

- **WHEN** the results panel is expanded
- **AND** the user presses `Enter` in the search input
- **THEN** the row of the new current match SHALL be indicated as current and scrolled into view

#### Scenario: Escape in the panel returns to the input

- **WHEN** focus is on a row in the results panel
- **AND** the user presses `Escape`
- **THEN** focus SHALL move to the search input
- **AND** the search SHALL remain open

### Requirement: Source filters narrow the match set

The results panel SHALL offer a filter per match source: labels, variable definitions, and variable references. The user MAY enable any combination of these filters. All SHALL be enabled by default. Each filter control SHALL show how many matches of its source the current query and matching options yield.

The matching options and the source filters SHALL persist across closing and reopening the search within the same editor. When every source is disabled, or the enabled sources yield no matches while the query does yield matches, the panel SHALL state how many matches the filters hide and SHALL offer an action that re-enables every source. While any source is disabled, the search bar SHALL indicate that filters are active, including while the results panel is collapsed.

#### Scenario: Show only references

- **WHEN** a query yields 3 label matches, 4 definition matches and 19 reference matches
- **AND** the user disables labels and variable definitions
- **THEN** the match set SHALL contain only the 19 reference matches
- **AND** the counter SHALL display a total of 19

#### Scenario: Filters hide everything

- **WHEN** a query yields only label matches
- **AND** the user disables labels
- **THEN** the panel SHALL state that the filters hide those matches
- **AND** activating its reset action SHALL enable every source and restore the matches

#### Scenario: Active filters are visible when collapsed

- **WHEN** any source filter is disabled
- **AND** the results panel is collapsed
- **THEN** the search bar SHALL indicate that filters are active

#### Scenario: Filters persist across reopening

- **WHEN** the user disables labels, turns whole word on, and closes the search
- **AND** the user opens the search again
- **THEN** labels SHALL still be disabled and whole word SHALL still be on

### Requirement: The filtered match set is the only match set

Matching options and source filters SHALL define the match set. An occurrence that the options exclude, or whose source is disabled, SHALL NOT be a match for any purpose:
- it SHALL NOT be listed in the results panel;
- it SHALL NOT be counted by the counter;
- it SHALL NOT be reachable with next or previous;
- it SHALL NOT mark its node or its field on the canvas.

When a change to the options or filters removes the current match, the current match SHALL follow the same rule as a graph edit that removes it: it SHALL become the nearest following match, otherwise the first match.

#### Scenario: Filtered matches do not mark the canvas

- **WHEN** node A matches only by its label
- **AND** the user disables labels
- **THEN** node A SHALL NOT show a match mark

#### Scenario: Filtering out the current match

- **WHEN** the current match is a label match followed by a reference match in canvas order
- **AND** the user disables labels
- **THEN** the current match SHALL become that reference match
