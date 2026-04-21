## 1. Store export contract

- [x] 1.1 Update store IO slice `exportDomain` implementation to return object payload and remove in-store `JSON.stringify`
- [x] 1.2 Update workflow store types so `exportDomain` return type reflects domain object contract

## 2. Boundary serialization updates

- [x] 2.1 Update call sites that require text export (clipboard/UI) to stringify locally
- [x] 2.2 Verify import flows that previously consumed `exportDomain()` string are adapted to explicit stringify

## 3. Test updates

- [x] 3.1 Update existing store/runtime tests to assert object return behavior
- [x] 3.2 Add or adjust tests for export boundary serialization behavior where string output is still required
