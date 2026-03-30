# workflow module boundaries

Date: 2026-03-30

## Goals

- keep node-definition concerns isolated by responsibility;
- reduce store coupling with node-specific business logic;
- preserve canvas render budget while scaling node kinds.

## Node registry boundaries

- `node-definitions.ts`
  - canonical node definition map (`kind`, labels, fields, defaults).
- `node-ui-metadata.ts`
  - UI access layer for palette/config panel (`getNodeDefinition`).
- `node-graph-rules.ts`
  - graph policy access (`getAllowedTargets`, `getNodeOutputPaths`).
- `node-config-normalization.ts`
  - config coercion and input validation for DTO/import paths.
- `node-factory.ts`
  - node id and creation (`createWorkflowNode`, `DEFAULT_NODE_WIDTH`).

This split prevents validation/expression/store modules from importing UI concerns
and keeps each dependency path explicit.

## Store write boundary

- `WorkflowStoreState` uses typed command:
  - `updateNodeConfig(nodeId, update: NodeConfigUpdate)`.
- `NodeConfigUpdate` is a discriminated union (`kind`, `key`, `value`) derived from
  `NodeConfigByKind`.
- `node-config-updates.ts` centralizes config update policies, including special
  behavior for `setVariable.variableName` rename and expression refactor.

## Performance guardrails

- `useNodeChangeRouter` now keeps stable callback identity across `nodes` array
  reference churn by reading latest nodes through a ref.
- Added hook tests to lock behavior:
  - stable callback identity when nodes array is recreated;
  - selection routing uses the latest node selection snapshot.
