"use client"

import { WorkflowEditor } from "./workflow/components/workflow-editor"
import {
  WorkflowStoreProvider,
  type WorkflowRuntimeConfig,
  type WorkflowStoreInitialProps,
} from "./workflow/store"

export type { WorkflowRuntimeConfig, WorkflowStoreInitialProps } from "./workflow/store"

export interface FlowProps extends WorkflowStoreInitialProps {
  runtime?: WorkflowRuntimeConfig
}

export const Flow = ({ initialGraph, runtime }: FlowProps = {}) => {
  return (
    <WorkflowStoreProvider initialGraph={initialGraph} runtime={runtime}>
      <WorkflowEditor />
    </WorkflowStoreProvider>
  )
}
