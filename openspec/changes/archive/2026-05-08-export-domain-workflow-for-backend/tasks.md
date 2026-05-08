## 1. Backend export types

- [x] 1.1 Add `BackendWorkflowDTO` and `BackendWorkflowNodeDTO` types with numeric node IDs
- [x] 1.2 Add regular-node and evaluator-node backend DTO variants
- [x] 1.3 Ensure backend node DTOs preserve `kind`, `position`, `label`, and `config`

## 2. Exporter implementation

- [x] 2.1 Add `exportDomainWorkflowForBackend(dto: DomainWorkflowDTO): BackendWorkflowDTO`
- [x] 2.2 Build graph indexes for nodes, incoming connections, and outgoing connections
- [x] 2.3 Resolve root nodes from `inlineExpression.config.isRoot === true`
- [x] 2.4 Implement deterministic Kahn-style topological ordering from roots
- [x] 2.5 Assign backend node IDs sequentially after ordering
- [x] 2.6 Map regular node outgoing links into `next: number[]`
- [x] 2.7 Map evaluator outgoing links into `next_true` and `next_false`
- [x] 2.8 Use `null` for missing evaluator branches and `[]` for terminal regular nodes

## 3. Export validation

- [x] 3.1 Fail when no root nodes exist
- [x] 3.2 Fail when a root node has incoming connections
- [x] 3.3 Fail when a connection references an unknown source or target node
- [x] 3.4 Fail when any node is unreachable from roots
- [x] 3.5 Fail when the reachable graph contains a cycle
- [x] 3.6 Fail when an evaluator has duplicate true or false branch connections

## 4. Public exports

- [x] 4.1 Export the backend exporter from the workflow mapper barrel
- [x] 4.2 Export backend DTO types from the public type surface
- [x] 4.3 Verify package entrypoint exports expose the new API where consumers need it

## 5. Tests

- [x] 5.1 Add tests for single-root linear graph ordering and numeric ID remapping
- [x] 5.2 Add tests for multiple roots ordered by position/label/id
- [x] 5.3 Add tests for converging branches ordered before shared downstream nodes
- [x] 5.4 Add tests for regular node `next` arrays
- [x] 5.5 Add tests for evaluator `next_true` and `next_false` mapping
- [x] 5.6 Add tests for missing evaluator branch values becoming `null`
- [x] 5.7 Add tests for result/terminal nodes exporting `next: []`
- [x] 5.8 Add validation tests for missing roots, root incoming edges, unknown edge endpoints, unreachable nodes, cycles, and duplicate evaluator branches
