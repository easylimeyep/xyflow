## ADDED Requirements

### Requirement: Flow package root exports initial-graph builder utilities
The flow package root SHALL expose the public initial-graph builder utilities alongside the existing workflow editor exports.

#### Scenario: Consumer imports initial-graph builders from package root
- **WHEN** a consumer imports from the `@workspace/flow` package root
- **THEN** the package MUST expose the synchronous linear initial-graph builder and the asynchronous ELK-backed initial-graph builder as named exports

#### Scenario: Consumer imports builder input types from package root
- **WHEN** a consumer imports the public initial-graph builder input types from the `@workspace/flow` package root
- **THEN** the imported types MUST describe the compact semantic graph input contract used by the builder utilities
