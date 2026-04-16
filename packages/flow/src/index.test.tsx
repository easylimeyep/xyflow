// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { WorkflowEditor } from "./index"
import type { DomainWorkflowDTO } from "./workflow/types"

function RuntimeProbe() {
  const exportDomain = WorkflowEditor.use.store((state) => state.exportDomain)
  const hasRuntimeExportMapper = WorkflowEditor.use.store((state) =>
    Boolean(state.runtime.exportDomain?.mapper)
  )
  const hasRuntimeImportMapper = WorkflowEditor.use.store((state) =>
    Boolean(state.runtime.importDomain?.mapper)
  )

  return (
    <div>
      <span data-testid="workflow-editor-export-domain">{exportDomain()}</span>
      <span data-testid="workflow-editor-has-runtime-export-mapper">
        {String(hasRuntimeExportMapper)}
      </span>
      <span data-testid="workflow-editor-has-runtime-import-mapper">
        {String(hasRuntimeImportMapper)}
      </span>
    </div>
  )
}

describe("WorkflowEditor package root", () => {
  afterEach(() => {
    cleanup()
  })

  it("lets consumers pass runtime import and export mappers", () => {
    render(
      <WorkflowEditor
        runtime={{
          importDomain: {
            mapper: (payload: DomainWorkflowDTO) => ({
              ...payload,
            }),
          },
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
      screen.getByTestId("workflow-editor-has-runtime-export-mapper").textContent
    ).toBe("true")
    expect(
      screen.getByTestId("workflow-editor-has-runtime-import-mapper").textContent
    ).toBe("true")
    expect(
      screen.getByTestId("workflow-editor-export-domain").textContent
    ).toContain("\"consumerMapper\": true")
  })

  it("keeps the initial runtime config when WorkflowEditor rerenders", () => {
    const firstRuntime = {
      importDomain: {
        mapper: (payload: DomainWorkflowDTO) => ({
          ...payload,
          metadata: {
            ...payload.metadata,
            importRuntimeLabel: "first-runtime",
          },
        }),
      },
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
      importDomain: {
        mapper: (payload: DomainWorkflowDTO) => ({
          ...payload,
          metadata: {
            ...payload.metadata,
            importRuntimeLabel: "second-runtime",
          },
        }),
      },
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
