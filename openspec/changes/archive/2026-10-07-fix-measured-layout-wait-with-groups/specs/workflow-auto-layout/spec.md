# Spec Delta

## MODIFIED Requirements

### Requirement: Measured initial auto-layout waits for node dimensions

When measured initial auto-layout is enabled, the workflow editor SHALL mount the initial graph, wait until rendered workflow nodes have measured dimensions, and then compute the initial layout using those measured dimensions. Only workflow nodes take part in this wait: the canvas elements that draw node groups (an expanded group's frame and a collapsed group's card) SHALL NOT be waited on, and workflow nodes hidden inside collapsed groups SHALL NOT be waited on.

#### Scenario: Initial graph is measured before layout

- **WHEN** `WorkflowEditor` is mounted with `autoLayoutOnInit="after-measure"` and an initial graph containing nodes
- **THEN** the editor SHALL render the nodes before running the initial ELK layout
- **AND** the initial ELK layout request MUST use measured node dimensions for nodes whose measurements are available.

#### Scenario: Long rendered node content affects initial placement

- **WHEN** a measured initial layout graph contains a node whose rendered height is larger than the layout fallback estimate
- **THEN** the computed initial placement SHALL account for the larger measured height
- **AND** downstream nodes SHALL NOT be placed as though the node still had only the fallback height.

#### Scenario: Empty graph does not wait indefinitely

- **WHEN** `WorkflowEditor` is mounted with `autoLayoutOnInit="after-measure"` and the current graph contains no nodes
- **THEN** the editor SHALL treat measured initial auto-layout as complete without waiting for node measurements.

#### Scenario: Graph with an expanded group completes the measured layout

- **WHEN** `WorkflowEditor` is mounted with `autoLayoutOnInit="after-measure"` and an initial graph containing an expanded group with member nodes
- **AND** every rendered workflow node has reported its dimensions
- **THEN** the editor SHALL run the initial ELK layout without waiting for the group frame to be measured
- **AND** the initialization loading state SHALL clear once the layout completes.

#### Scenario: Graph whose nodes are all inside collapsed groups completes the measured layout

- **WHEN** `WorkflowEditor` is mounted with `autoLayoutOnInit="after-measure"` and every workflow node in the initial graph is a member of a collapsed group
- **THEN** the editor SHALL run the initial ELK layout without waiting for the hidden members or the group cards to be measured
- **AND** the initialization loading state SHALL clear once the layout completes.

#### Scenario: Graph already measured at mount completes the measured layout

- **WHEN** `WorkflowEditor` is mounted with `autoLayoutOnInit="after-measure"` and every node it waits on already has measured dimensions when the canvas mounts
- **THEN** the editor SHALL run the initial ELK layout once
- **AND** the initialization loading state SHALL clear once the layout completes, even if the canvas re-runs its initialization before the layout finishes.
