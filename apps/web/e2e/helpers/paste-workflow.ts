import { expect, type Page } from "@playwright/test"

interface WorkflowInput {
  nodes: readonly {
    id: string
    kind: string
    position: { x: number; y: number }
    label: string
    config: unknown
  }[]
  connections: readonly {
    id: string
    sourceNodeId: string
    targetNodeId: string
    sourceHandle: string | null
    targetHandle: string | null
  }[]
}

/** Where the pasted graph's top-left corner lands, in pane pixels. */
const PASTE_AT = { x: 300, y: 200 }

/**
 * Replaces the starting graph on `/` with `workflow`: deletes the sample node,
 * then pastes the workflow as a Ctrl+V selection. Pasted nodes get new ids,
 * so look them up by label. Leaves nothing selected.
 */
export async function pasteWorkflow(page: Page, workflow: WorkflowInput) {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/")
  const nodes = page.getByTestId("workflow-node")
  await expect(nodes).toHaveCount(1)

  await nodes.first().click()
  await page.keyboard.press("Delete")
  await expect(nodes).toHaveCount(0)

  await page.evaluate(
    (text) => navigator.clipboard.writeText(text),
    JSON.stringify({
      kind: "workflow-selection-v1",
      nodes: workflow.nodes,
      connections: workflow.connections,
    })
  )
  const pane = page.locator(".react-flow__pane")
  await pane.click({ position: PASTE_AT })
  // The pointer position the paste anchors to is recorded once per frame.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
  )
  await page.keyboard.press("ControlOrMeta+v")
  await expect(nodes).toHaveCount(workflow.nodes.length)

  // The paste selects what it pasted; the top-left corner stays empty.
  await pane.click({ position: { x: 40, y: 40 } })
  await expect(page.locator(".react-flow__node.selected")).toHaveCount(0)
}

/** The React Flow wrapper of the workflow node labelled `label`. */
export function nodeByLabel(page: Page, label: string) {
  return page
    .locator(".react-flow__node")
    .filter({ has: page.getByText(label, { exact: true }) })
}
