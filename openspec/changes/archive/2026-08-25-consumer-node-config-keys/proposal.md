## Why

`2026-08-25-extensible-node-registry` opened the vocabulary but not the config surface a registered
kind may declare. Two things still assume the five built-in kinds:

- `NodeConfigUpdate` is a mapped type over `NodeConfigByKind`, which lists the built-ins only. A
  consumer cannot construct a typed config update for its own kind at all, so a bespoke config panel
  outside this package cannot call `updateNodeConfig` without casting through the type system.
- Three call sites treat `buildDefaultConfig()` as the definition of "which keys exist":
  `applyUpdateNodeConfigCommand` rejects a key absent from it, `normalizeNodeConfig` copies only its
  keys, and `decodeNodeConfig` refuses a document carrying anything else.

The second is wrong even for this package's own contract. `fields` is what a definition declares as
editable; `buildDefaultConfig` is what a freshly dropped node starts with. Those are the same set
only when every field has a sensible seed value. A consumer deriving fields from a schema where an
optional number is constrained (`positive()`, say) must leave that key out of the default config —
seeding `0` would make a new node invalid on a field the user never touched. Today that key is then
uneditable in the panel, silently dropped on load, and rejected on import: the node has a field the
editor refuses to store.

## What Changes

- Add `getNodeConfigKeys(definition)` — the declared config surface of a kind: the union of its
  `fields` keys, its `inlineFields` keys and its default-config keys.
- Resolve key validity through it in `applyUpdateNodeConfigCommand`, `normalizeNodeConfig` and
  `decodeNodeConfig`, so a declared-but-unseeded key is editable, survives a round trip, and passes
  import.
- Widen `NodeConfigUpdate` to a union: the existing per-built-in-kind payloads, plus a registered
  kind's payload typed as `{ kind: string; key: string; value: JsonValue }`. Built-in updates keep
  their exact key/value typing.
- Keep the value check unchanged: a definition's `validateConfigValue` remains the only authority on
  whether a value is acceptable.

## Capabilities

### New Capabilities
- `consumer-node-config-keys`: a registered kind's declared fields are its config surface for
  editing, normalization and import, and its config updates are expressible in the public types.

## Impact

- Affected code: `workflow/node-registry/{define-node,node-config-normalization}.ts`,
  `workflow/graph-engine/commands.ts`, `workflow/store/types.ts`.
- Behaviour for the built-in five: unchanged. Their fields and default-config keys already coincide,
  so the union is the same set it was.
- Persistence: a config key that was previously dropped is now preserved. No stored document changes
  shape; documents that carried such a key stop losing it.
- Testing: key-surface resolution, an update against a declared-but-unseeded key, a round trip that
  keeps it, and an import that accepts it.

## Non-goals

- No config-schema validation inside the package. A consumer's shape stays checked by its own
  `validateConfigValue`.
- No change to how a kind is registered, to the DTO shape, or to the runtime observation overlay.
