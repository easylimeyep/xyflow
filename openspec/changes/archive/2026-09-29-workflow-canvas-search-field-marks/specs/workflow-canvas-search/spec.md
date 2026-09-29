## MODIFIED Requirements

### Requirement: Canvas search matches occurrences across labels and variables

The workflow editor SHALL provide a canvas search that matches a non-empty query against three occurrence sources in every node:
- the node label;
- the variable name the node defines, if its kind defines one and holds that name in a field of its own;
- each variable reference inside a `{{…}}` expression segment of the node's expression fields, covering the same fields that variable rename updates.

When a node's variable name is taken from its label rather than from a field of its own, the label match SHALL be the only match for that text; the search SHALL NOT report a separate variable-definition match for it.

Matching SHALL be case-insensitive substring matching. Each occurrence SHALL count as a separate match, so a single node MAY contribute several matches. Text outside `{{…}}` segments in expression fields SHALL NOT produce matches. A query that is empty or contains only whitespace SHALL produce no matches.

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
