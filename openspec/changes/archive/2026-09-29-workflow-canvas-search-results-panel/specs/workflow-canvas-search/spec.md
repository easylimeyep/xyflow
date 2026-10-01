## MODIFIED Requirements

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

## ADDED Requirements

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
