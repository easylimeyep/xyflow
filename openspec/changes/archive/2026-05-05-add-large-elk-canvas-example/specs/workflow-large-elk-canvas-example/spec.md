# workflow-large-elk-canvas-example Specification

## Purpose
Define the demo behavior for a large workflow canvas example that uses ELK-backed initial graph positioning.

## Requirements
### Requirement: Web examples include a large ELK-positioned workflow
The web examples SHALL include a separate large workflow demo that builds its initial graph with the existing `createInitialGraphElk` helper.

#### Scenario: Large ELK example renders from compact graph input
- **WHEN** the web examples page renders the large ELK example tab
- **THEN** the example SHALL compute its graph through `createInitialGraphElk`
- **AND** the example SHALL pass the resolved graph into `WorkflowEditor`
- **AND** the compact graph input SHALL NOT manually specify node positions.

### Requirement: Large ELK example exercises dense workflow topology
The large ELK example SHALL contain about 40 workflow nodes and include a dense fan-in section.

#### Scenario: Dense topology is present
- **WHEN** the graph input is inspected
- **THEN** it SHALL start with a root Keyword node
- **AND** it SHALL end with terminal Result nodes for true and false outcomes
- **AND** one non-root node SHALL have at least 10 incoming edges from distinct upstream nodes.

### Requirement: Existing ELK example remains available
The existing small ELK graph example SHALL remain available as its own demo.

#### Scenario: Small and large ELK examples are separate
- **WHEN** the web examples page is viewed
- **THEN** the current small ELK example SHALL remain selectable
- **AND** the large ELK example SHALL be selectable from a separate tab.
