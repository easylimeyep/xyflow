## 1. Restore Edge Visual Contract

- [x] 1.1 Update `WorkflowEdgeComponent` so standard workflow edges render with the existing React Flow Bezier path from source and target handle coordinates.
- [x] 1.2 Remove, ignore, or isolate ELK route metadata so it no longer changes the default workflow edge visual.
- [x] 1.3 Update workflow edge unit tests to assert Bezier rendering remains active even when route metadata exists.
- [x] 1.4 Remove or revise routed-edge path tests that only cover the superseded orthogonal rendered-path behavior.

## 2. Improve ELK Node Placement Clearance

- [x] 2.1 Review current ELK options and branch port ordering for the large ELK example target case.
- [x] 2.2 Tune ELK spacing, node placement, and ordering constraints to create clearer lanes for branch shortcut connections while preserving left-to-right layout.
- [x] 2.3 If ELK options alone are insufficient, add a deterministic post-layout clearance step for branch shortcut patterns without changing graph connectivity.
- [x] 2.4 Add unit coverage proving layout adjustments preserve node ids, edge ids, source/target nodes, and source/target handles.

## 3. Large Example Regression Coverage

- [x] 3.1 Add or update tests around the large ELK graph input so the `Auto approve?`-style shortcut branch path remains part of the regression target.
- [x] 3.2 Verify the large ELK example visually in the browser after implementation, focusing on shortcut branch connections and nearby intermediate nodes.
- [x] 3.3 Capture any remaining acceptable limitation in the implementation notes if arbitrary manual layouts can still cross visually.

## 4. Verification

- [x] 4.1 Run focused workflow edge and layout tests.
- [x] 4.2 Run `pnpm --filter @workspace/flow typecheck`.
- [x] 4.3 Run `pnpm --filter @workspace/flow lint`.
- [x] 4.4 Run the full `@workspace/flow` test suite or document any known unrelated flaky failure.

Full suite note: `src/workflow/store/store.performance.test.ts` failed its timing threshold in this run (`13.997ms` average vs `< 8ms`), matching the known environment-sensitive performance-budget failure observed before this change. All other test files passed.
