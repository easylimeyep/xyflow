// @vitest-environment jsdom

import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DefaultNodeRenderer } from "../nodes/shared/default-node-renderer"
import { builtinBaseDefinitions } from "./builtin-base-definitions"
import { builtinDefinitions } from "./builtin-definitions"
import { createNodeRegistry, type NodeKind } from "./registry"

/**
 * The kinds this suite exercises, fixed at collection time.
 *
 * `it.each` evaluates its argument when the test FILE is COLLECTED, before any
 * `it`/`beforeAll` body runs, so the list has to come from something that is
 * fully built at module-load time. `builtinDefinitions` is a plain constant, so
 * it always is. A list derived from anything more dynamic can go stale without
 * failing: get it wrong and `it.each` emits ZERO cases rather than an error —
 * the suite reports success having run nothing. The non-empty guard below
 * catches that.
 */
const builtinKinds = builtinDefinitions.map((definition) => definition.kind)

const registry = createNodeRegistry(builtinDefinitions)

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: {
    Left: "left",
    Right: "right",
  },
}))

vi.mock(
  "../nodes/output-quick-add-affordance/output-quick-add-affordance",
  () => ({
    OutputQuickAddAffordance: () => null,
  })
)

describe("registry smoke tests", () => {
  it("builds a non-empty vocabulary from the built-ins", () => {
    // A guard against the failure mode `builtinKinds` (above) exists to avoid:
    // if that list ever came back empty, every `it.each` below would emit zero
    // cases — a suite reporting success having run nothing. This assertion
    // fails loudly instead.
    expect(builtinKinds.length).toBeGreaterThan(0)
    expect(registry.list().length).toBe(builtinKinds.length)
  })

  it("every kind in the vocabulary resolves to its own definition", () => {
    for (const kind of registry.kinds()) {
      expect(registry.get(kind)?.kind).toBe(kind)
    }
  })

  it("the base definitions cover exactly the same kinds as the built-ins", () => {
    // `builtin-definitions.ts` (with renderers) and `builtin-base-definitions.ts`
    // (without) are two hand-maintained lists of the same five kinds. Nothing
    // else keeps them in step: add a sixth built-in to one and every suite that
    // builds its vocabulary from the other silently runs against a narrower
    // package than the one that ships.
    expect(builtinBaseDefinitions.map((definition) => definition.kind)).toEqual(
      builtinKinds
    )
  })

  it.each(builtinKinds)(
    "node kind '%s' has valid definition fields",
    (kind) => {
      const definition = registry.get(kind as NodeKind)!

      expect(definition).toBeDefined()
      expect(definition.kind).toBe(kind)
      expect(typeof definition.title).toBe("string")
      expect(definition.title.length).toBeGreaterThan(0)
      expect(typeof definition.description).toBe("string")
      expect(definition.icon).toBeDefined()
      expect(["control", "logic", "data", "io"]).toContain(definition.category)
      expect(Array.isArray(definition.fields)).toBe(true)
      expect(Array.isArray(definition.outputPaths)).toBe(true)
      expect(Array.isArray(definition.allowedTargets)).toBe(true)
      expect(typeof definition.buildDefaultConfig).toBe("function")
    }
  )

  it.each(builtinKinds)(
    "node kind '%s' builds valid default config",
    (kind) => {
      const definition = registry.get(kind as NodeKind)!
      const config = definition.buildDefaultConfig()

      expect(config).toBeDefined()
      expect(typeof config).toBe("object")
      expect(config).not.toBeNull()
    }
  )

  it.each(builtinKinds)(
    "node definition '%s' renders via DefaultNodeRenderer without client bindings",
    (kind) => {
      const definition = registry.get(kind as NodeKind)!

      const { container } = render(
        <DefaultNodeRenderer
          id={`test-${kind}`}
          type={kind}
          data={{
            kind,
            label: definition.title,
            config: definition.buildDefaultConfig(),
          }}
          selected={false}
          dragging={false}
          zIndex={1}
          selectable
          deletable
          draggable
          isConnectable
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          definition={definition}
        />
      )

      expect(container.textContent).toContain(definition.title)
    }
  )

  it("pure node definitions do not carry client component bindings", () => {
    for (const definition of registry.list()) {
      expect("component" in definition).toBe(false)
    }
  })

  it("all allowedTargets reference valid node kinds", () => {
    for (const definition of registry.list()) {
      for (const target of definition.allowedTargets) {
        expect(registry.has(target as NodeKind)).toBe(true)
      }
    }
  })
})
