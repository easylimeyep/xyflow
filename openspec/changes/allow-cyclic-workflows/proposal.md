## Why

Current workflow editing enforces acyclic graphs, which blocks valid product use cases where nodes need to reference downstream outcomes through loop-like links. We need to allow cyclic authoring in the UI while keeping the exported API shape stable for backend consumers.

## What Changes

- Allow users to create and persist cyclic connections in workflow graphs.
- Update connection validation and graph commands to stop rejecting edges solely because they create a cycle.
- Remove deterministic linear initial layout behavior and use ELK-based layout flow only.
- Update strict backend export (`exportDomainWorkflowForBackend`) to support cyclic graphs instead of failing on cycle detection.
- Preserve existing export DTO shape (no schema-breaking API change), while documenting that node ordering is no longer guaranteed topological.

## Capabilities

### New Capabilities
- `workflow-cyclic-graphs`: Enable authoring, validating, and exporting workflow graphs that include cycles without changing DTO schema.

### Modified Capabilities
- `workflow-graph-engine-v2`: Connection validation and connect commands no longer enforce acyclicity.
- `workflow-initial-graph-builders`: Initial graph creation no longer uses or depends on DAG-only linear layout.
- `workflow-node-api-v2`: Strict export supports cyclic graphs while keeping the output format stable.

## Impact

- Affected code: `workflow/validation`, `workflow/graph-engine`, `workflow/initial-graph`, `workflow/layout`, and backend export mappers.
- Affected behavior: cycle rejection errors are removed from UI/connect flows and strict export.
- API/contract: no DTO schema changes; semantic behavior expands to include cyclic graphs.
- Testing: update DAG-only assumptions in validation/export/initial-graph tests and add cycle coverage.
