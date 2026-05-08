## 1. Connection invariants

- [x] 1.1 Add evaluator source-handle validation to shared connection validation
- [x] 1.2 Ensure evaluator outgoing connections with `sourceHandle: null` are rejected with a clear error
- [x] 1.3 Keep `evaluator-true` and `evaluator-false` accepted for evaluator outgoing connections
- [x] 1.4 Confirm regular node default-output connections still allow `sourceHandle: null`

## 2. Edge insertion

- [x] 2.1 Update edge insertion so an inserted evaluator continues to the original target from `evaluator-true`
- [x] 2.2 Preserve the original edge source handle on the upstream split leg
- [x] 2.3 Leave the inserted evaluator false branch unconnected
- [x] 2.4 Ensure fallback insertion behavior does not create invalid evaluator outgoing edges

## 3. UI affordances

- [x] 3.1 Add or update tests proving the true branch quick-add button is hidden when a true edge exists
- [x] 3.2 Add or update tests proving the false branch quick-add button remains available when only true is connected
- [x] 3.3 Verify the broken canvas scenario no longer shows an extra `+` on the connected true branch

## 4. Regression coverage

- [x] 4.1 Add validation tests for evaluator outgoing handle requirements
- [x] 4.2 Add edge insertion tests for inserting evaluator on `evaluator-true -> target`
- [x] 4.3 Add store-level regression for the backend-transform demo path
- [x] 4.4 Add backend export regression showing the edge-insertion result exports successfully

## 5. Verification

- [x] 5.1 Run affected workflow store, validation, graph-engine, and backend-export tests
- [x] 5.2 Run broader package test suite if affected tests pass
- [ ] 5.3 Manually verify the backend-transform demo UI path
