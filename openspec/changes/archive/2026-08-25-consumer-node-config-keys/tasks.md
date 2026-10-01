## 1. Declared Config Surface

- [x] 1.1 Add `getNodeConfigKeys(definition)` returning the union of `fields`, `inlineFields` and default-config keys, in declaration order.
- [x] 1.2 Resolve key validity in `applyUpdateNodeConfigCommand` through it.
- [x] 1.3 Copy every declared key in `normalizeNodeConfig`, seeding from the default config where present.
- [x] 1.4 Accept every declared key in `decodeNodeConfig`.

## 2. Public Types

- [x] 2.1 Widen `NodeConfigUpdate` with a registered-kind payload while keeping the built-in payloads exactly typed.

## 3. Tests

- [x] 3.1 `getNodeConfigKeys` unions fields and default config without duplicates.
- [x] 3.2 A declared-but-unseeded key is accepted by an update command and rejected when undeclared.
- [x] 3.3 `normalizeNodeConfig` keeps a declared-but-unseeded key and still drops an undeclared one.
- [x] 3.4 `decodeNodeConfig` accepts a document carrying a declared-but-unseeded key.
