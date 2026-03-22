"use client"

import { WorkflowEditor } from "./workflow/components/workflow-editor"
import { WorkflowStoreProvider } from "./workflow/store"

export const Flow = () => {
  return (
    <WorkflowStoreProvider>
      <WorkflowEditor />
    </WorkflowStoreProvider>
  )
}
