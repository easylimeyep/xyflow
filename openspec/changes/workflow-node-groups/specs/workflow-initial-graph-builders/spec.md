## ADDED Requirements

### Requirement: Initial graph input declares node groups

The compact initial-graph input SHALL accept an optional `groups` list. Each entry SHALL have an `id` and the ids of its member nodes, and MAY set a `label` (default `Group N` by position), a `color` token (default the default group color), and `collapsed` (default `false`). A group MAY have no members. The builders SHALL reject, with an explicit error, a group that references a node not in the input, a node listed in more than one group, and a duplicate group id. `createInitialGraph` SHALL fit each non-empty group's frame around its members. `createInitialGraphElk` SHALL lay the members out and fit each non-empty expanded frame around them; a group that starts collapsed SHALL have its members laid out as if it were expanded, and SHALL then take the place of one card-sized block in the layout, with its members keeping their arrangement. Group types and group color constants SHALL be exported from the package entry point.

#### Scenario: Groups are built from the input

- **WHEN** the input groups nodes `b` and `c` as "Parse" in green and node `d` without a label
- **THEN** `b` and `c` MUST belong to a group labeled "Parse" with color "green"
- **AND** `d` MUST belong to a group labeled "Group 2" with the default color

#### Scenario: Invalid group input fails clearly

- **WHEN** a group references a node id that is not in the input
- **THEN** the builder MUST throw an error naming the group and the node

#### Scenario: A collapsed group is laid out with real member positions

- **WHEN** `createInitialGraphElk` builds a graph whose group starts collapsed
- **THEN** the group MUST stay collapsed
- **AND** its members MUST have distinct laid-out positions inside its frame, so expanding it shows them arranged
