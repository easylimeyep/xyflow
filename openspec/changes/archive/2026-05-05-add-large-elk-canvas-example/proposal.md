## Why

The web demo has a small ELK example, but it does not show how the canvas behaves with a dense, realistic workflow where many branches converge before terminal results. A large builder-based example makes ELK default positioning easier to inspect and regression-test manually.

## What Changes

- Add a large workflow example that builds an `initialGraph` through `createInitialGraphElk`.
- Include about 40 nodes, starting from a root Keyword and ending in `result true` / `result false` terminal branches.
- Include one convergence Keyword node with at least 10 incoming connections.
- Add the example as a separate tab so the existing smaller ELK example remains available.

## Capabilities

### New Capabilities
- `workflow-large-elk-canvas-example`: Demonstrates a large ELK-positioned workflow canvas with dense fan-in and terminal result branches.

### Modified Capabilities

## Impact

- Affected code is limited to the web examples under `apps/web/app/components/workflow-examples/` and the demo tab list in `apps/web/app/page.tsx`.
- No public API, dependency, persistence, or package export changes are expected.
