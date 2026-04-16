// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { WorkflowEditor } from "./index"
import type { DomainWorkflowDTO } from "./workflow/types"

function RuntimeProbe() {
  const exportDomain = WorkflowEditor.use.store((state) => state.exportDomain)
  const hasRuntimeMapper = WorkflowEditor.use.store((state) =>
    Boolean(state.runtime.exportDomain?.mapper)
  )

  return (
    <div>
      <span data-testid="workflow-editor-export-domain">{exportDomain()}</span>
      <span data-testid="workflow-editor-has-runtime-mapper">
        {String(hasRuntimeMapper)}
      </span>
    </div>
  )
}

describe("WorkflowEditor package root", () => {
  afterEach(() => {
    cleanup()
  })

  it("lets consumers pass a runtime export mapper", () => {
    render(
      <WorkflowEditor
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
      >
        <RuntimeProbe />
      </WorkflowEditor>
    )

    expect(
      screen.getByTestId("workflow-editor-has-runtime-mapper").textContent
    ).toBe("true")
    expect(
      screen.getByTestId("workflow-editor-export-domain").textContent
    ).toContain("\"consumerMapper\": true")
  })

  it("keeps the initial runtime config when WorkflowEditor rerenders", () => {
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

    const view = render(
      <WorkflowEditor runtime={firstRuntime}>
        <RuntimeProbe />
      </WorkflowEditor>
    )
    expect(
      screen.getByTestId("workflow-editor-export-domain").textContent
    ).toContain("\"runtimeLabel\": \"first-runtime\"")

    view.rerender(
      <WorkflowEditor runtime={secondRuntime}>
        <RuntimeProbe />
      </WorkflowEditor>
    )

    expect(
      screen.getByTestId("workflow-editor-export-domain").textContent
    ).toContain("\"runtimeLabel\": \"first-runtime\"")
    expect(
      screen.getByTestId("workflow-editor-export-domain").textContent
    ).not.toContain("\"runtimeLabel\": \"second-runtime\"")

    view.unmount()
    render(
      <WorkflowEditor runtime={secondRuntime}>
        <RuntimeProbe />
      </WorkflowEditor>
    )

    expect(
      screen.getByTestId("workflow-editor-export-domain").textContent
    ).toContain("\"runtimeLabel\": \"second-runtime\"")
  })
})
