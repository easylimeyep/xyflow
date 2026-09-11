// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { WorkflowStoreProvider } from "../../store"
import type { FieldOption } from "../../types"
import {
  resolveSelectedOptionValue,
  useNodeSelectOptions,
} from "./use-node-select-options"

const BUILT_IN_OPTIONS: FieldOption[] = [
  { value: "value", label: "value" },
  { value: "string", label: "string" },
]

function OptionProbe() {
  const options = useNodeSelectOptions(
    "pathExtractor",
    "outputType",
    BUILT_IN_OPTIONS
  )

  return <span data-testid="options">{JSON.stringify(options)}</span>
}

describe("useNodeSelectOptions", () => {
  afterEach(() => {
    cleanup()
  })

  it("falls back to the options the node ships with", () => {
    render(
      <WorkflowStoreProvider>
        <OptionProbe />
      </WorkflowStoreProvider>
    )

    expect(screen.getByTestId("options").textContent).toBe(
      JSON.stringify(BUILT_IN_OPTIONS)
    )
  })

  it("prefers the host options for that kind and config key", () => {
    render(
      <WorkflowStoreProvider
        runtime={{
          nodeOptions: {
            pathExtractor: {
              outputType: [{ value: "digest", label: "Digest" }],
            },
          },
        }}
      >
        <OptionProbe />
      </WorkflowStoreProvider>
    )

    expect(screen.getByTestId("options").textContent).toBe(
      JSON.stringify([{ value: "digest", label: "Digest" }])
    )
  })

  it("keeps the built-in options for a key the host left out", () => {
    render(
      <WorkflowStoreProvider
        runtime={{
          nodeOptions: {
            jsonEvaluator: {
              matchType: [{ value: "at-least-two", label: "At least two" }],
            },
          },
        }}
      >
        <OptionProbe />
      </WorkflowStoreProvider>
    )

    expect(screen.getByTestId("options").textContent).toBe(
      JSON.stringify(BUILT_IN_OPTIONS)
    )
  })
})

describe("resolveSelectedOptionValue", () => {
  it("keeps a stored value the active options still offer", () => {
    expect(
      resolveSelectedOptionValue(BUILT_IN_OPTIONS, "string", "value")
    ).toBe("string")
  })

  it("falls back to the first option for a value outside the list", () => {
    // A node dropped under the built-in defaults, then rendered with host
    // options that never contained that default, must not show a blank select.
    expect(
      resolveSelectedOptionValue(
        [{ value: "digest", label: "Digest" }],
        "value",
        "value"
      )
    ).toBe("digest")
  })

  it("falls back to the given default when there are no options at all", () => {
    expect(resolveSelectedOptionValue([], undefined, "value")).toBe("value")
  })
})
