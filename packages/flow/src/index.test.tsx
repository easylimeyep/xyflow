// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Flow } from "./index"
import type { DomainWorkflowDTO } from "./workflow/types"

vi.mock("./workflow/components/workflow-editor", async () => {
  const { useWorkflowStore } = await import("./workflow/store")

  return {
    WorkflowEditor: () => {
      const exportDomain = useWorkflowStore((state) => state.exportDomain)
      const hasRuntimeMapper = useWorkflowStore((state) =>
        Boolean(state.runtime.exportDomain?.mapper)
      )

      return (
        <div>
          <span data-testid="flow-export-domain">{exportDomain()}</span>
          <span data-testid="flow-has-runtime-mapper">{String(hasRuntimeMapper)}</span>
        </div>
      )
    },
  }
})

describe("Flow", () => {
  afterEach(() => {
    cleanup()
  })

  it("lets consumers pass a runtime export mapper", () => {
    render(
      <Flow
        runtime={{
          exportDomain: {
            mapper: (payload: DomainWorkflowDTO) => ({
              ...payload,
              metadata: {
                ...payload.metadata,
                consumerMapper: true,
              },
            }),
          },
        }}
      />
    )

    expect(screen.getByTestId("flow-has-runtime-mapper").textContent).toBe("true")
    expect(screen.getByTestId("flow-export-domain").textContent).toContain(
      "\"consumerMapper\": true"
    )
  })

  it("keeps the initial runtime config when Flow rerenders", () => {
    const firstRuntime = {
      exportDomain: {
        mapper: (payload: DomainWorkflowDTO) => ({
          ...payload,
          metadata: {
            ...payload.metadata,
            runtimeLabel: "first-runtime",
          },
        }),
      },
    }
    const secondRuntime = {
      exportDomain: {
        mapper: (payload: DomainWorkflowDTO) => ({
          ...payload,
          metadata: {
            ...payload.metadata,
            runtimeLabel: "second-runtime",
          },
        }),
      },
    }

    const view = render(<Flow runtime={firstRuntime} />)
    expect(screen.getByTestId("flow-export-domain").textContent).toContain(
      "\"runtimeLabel\": \"first-runtime\""
    )

    view.rerender(<Flow runtime={secondRuntime} />)

    expect(screen.getByTestId("flow-export-domain").textContent).toContain(
      "\"runtimeLabel\": \"first-runtime\""
    )
    expect(screen.getByTestId("flow-export-domain").textContent).not.toContain(
      "\"runtimeLabel\": \"second-runtime\""
    )

    view.unmount()
    render(<Flow runtime={secondRuntime} />)

    expect(screen.getByTestId("flow-export-domain").textContent).toContain(
      "\"runtimeLabel\": \"second-runtime\""
    )
  })
})
