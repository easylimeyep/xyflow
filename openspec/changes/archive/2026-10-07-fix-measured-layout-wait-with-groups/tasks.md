# Tasks

## 1. Reproduce the hang in a real browser (RED)

- [x] 1.1 Add the graphs for the two cases in `apps/web/app/fixtures/measured-groups/graphs.ts`, built with `createInitialGraph(builtinDefinitions, ...)`: (a) a chain where some nodes form one expanded group, plus at least one ungrouped node; (b) a graph where every node belongs to a collapsed group (at least two groups). Verify `pnpm --filter web typecheck` passes.
- [x] 1.2 Add the fixture routes `apps/web/app/fixtures/measured-groups/expanded/page.tsx` and `.../collapsed/page.tsx`. Each renders `WorkflowEditor` with `autoLayoutOnInit="after-measure"` and its graph, following the shape of `apps/web/app/tour/chain/page.tsx`. Verify by opening both routes in `pnpm --filter web dev`: today the "Preparing measured layout..." overlay stays.
- [x] 1.3 Add `apps/web/e2e/workflow-measured-layout-groups.spec.ts`. For each route, assert that the status with "Preparing measured layout" becomes hidden, and that the canvas content is visible (a member node label for the expanded case, a group card label for the collapsed case). Verify that `pnpm --filter web test:e2e workflow-measured-layout-groups` fails on both cases on the overlay assertion (RED).

## 2. Wait only for workflow nodes (GREEN)

- [x] 2.1 In `packages/flow/src/workflow/components/workflow-canvas/workflow-canvas.tsx`, remove the `useNodesInitialized` import and call, drop `nodesInitialized` from the wait condition and from the effect's dependency list, and leave `allNodesMeasured` as the only measurement gate. Update the comment above `allNodesMeasured` to say that derived group nodes are not waited on. Verify `pnpm --filter web test:e2e workflow-measured-layout-groups` passes on both cases.
- [x] 2.2 In `workflow-canvas.test.tsx`, remove `useNodesInitialized` from the `@xyflow/react` mock and remove the now unused `nodesInitializedMock` and its resets. Add a test: with `groups` holding one expanded group whose members are among the measured nodes, `autoLayoutOnInit="after-measure"` calls `onMeasuredInitialAutoLayout` once and the "Preparing measured layout" status disappears. Verify `cd packages/flow && pnpm vitest run src/workflow/components/workflow-canvas/workflow-canvas.test.tsx` passes, including the existing measured-layout tests.

- [x] 2.3 In `workflow-canvas.tsx`, replace the effect-local `cancelled` flag of the measured initial layout with a component-level mounted ref (design D3), so the settled layout clears `initialLayoutPending` and schedules the fit whenever the canvas is still mounted. Add a test in `workflow-canvas.test.tsx`, without groups, that mounts the canvas with already measured nodes and `autoLayoutOnInit="after-measure"`, re-runs the initialization effect while the layout is still pending (a rerender with a new `onMeasuredInitialAutoLayout`; jsdom does not replay this effect under `<StrictMode>`), then settles the layout, and asserts that the layout ran once, the fit ran once and the "Preparing measured layout" status disappears; verify it fails before the change. Verify `pnpm --filter web test:e2e workflow-measured-layout-groups` passes on both cases and the canvas test file passes.

## 3. Integration checks

- [x] 3.1 Run `pnpm --filter @flow/flow test`, `pnpm typecheck`, and `pnpm lint` from the repo root, and verify all pass.
- [x] 3.2 Run the existing group and smoke e2e specs (`pnpm --filter web test:e2e workflow-node-groups` and `pnpm --filter web test:e2e:smoke`), plus the new spec, and verify all pass.
- [x] 3.3 Run `openspec validate fix-measured-layout-wait-with-groups --strict` and verify it reports the change as valid.
