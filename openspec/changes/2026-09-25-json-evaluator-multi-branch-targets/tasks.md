## 1. Definition-level switch

- [x] 1.1 Add `multipleBranchTargets?: boolean` to `NodeDefinition` and verify `tsc --noEmit` passes for `packages/flow`
- [x] 1.2 Add `allowsMultipleBranchTargets(registry, kind)` to `node-graph-rules.ts`, answering `true` only for a registered branching kind that declares the flag; verify with `node-graph-rules.test.ts` (fan-out kind, unregistered kind, flag on a non-branching kind)
- [x] 1.3 Declare `multipleBranchTargets: true` on the `jsonEvaluator` definition, leave `evaluator` unchanged; verify the helper test reports `true` / `false` for the two kinds

## 2. Connection validation

- [x] 2.1 Skip the one-target-per-branch check in `validateConnection` for fan-out kinds; verify `validation.test.ts` accepts a second `jsonEvaluator` target on both branches
- [x] 2.2 Keep the exact-duplicate check for fan-out branches and the single-target rule for `evaluator`; verify the existing `evaluator` rejection tests and the new duplicate test pass

## 3. Quick-add

- [x] 3.1 Add `isOutputSaturated` (edges first, kind resolved lazily) and route `startQuickAddFromOutput` and `confirmQuickAddNode` through it; verify `store.test.ts` quick-adds two targets on one `jsonEvaluator` branch and still refuses a second on `evaluator`
- [x] 3.2 Drive the quick-add affordance's visibility from `isOutputSaturated`; verify `output-quick-add-affordance.test.tsx` keeps the button on a connected `jsonEvaluator` branch and hides it on a connected `evaluator` branch

## 4. Backend export

- [x] 4.1 Split `BackendEvaluatorWorkflowNodeDTO` into single-target and multi-target shapes, export both plus `isMultiTargetEvaluatorDTO` from the package entry; verify the guard test in `backend-export.test.ts`
- [x] 4.2 Make `exportDomainWorkflowForBackend` / `exportDraftDomainWorkflowForBackend` take the registry first; verify every existing export test passes with the registry argument
- [x] 4.3 Serialize fan-out branches as `number[]` (`[]` when unconnected) and stop rejecting several targets on them in strict export; verify the list, empty-list, plain-evaluator and registry-override tests
- [x] 4.4 Keep every fan-out branch target in draft export; verify the draft `jsonEvaluator` test

## 5. Layout and callers

- [x] 5.1 Limit evaluator shortcut clearance to opposite-branch siblings; verify the new `elk-layout.test.ts` case returns the node array unchanged and the existing clearance test still passes
- [x] 5.2 Update the Storybook backend-transform example to pass `useNodeRegistry()`; verify `pnpm typecheck` passes across the monorepo

## 6. Verification

- [x] 6.1 Run `pnpm vitest run` in `packages/flow` and verify all suites pass
- [x] 6.2 Run eslint on the changed files and verify no errors or new warnings
- [ ] 6.3 Confirm the backend accepts list-shaped `next_true` / `next_false` for `jsonEvaluator` against a real deployment before release
