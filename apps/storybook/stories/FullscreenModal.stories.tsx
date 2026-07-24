import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, screen, userEvent, waitFor, within } from "storybook/test"

import { FullscreenModalExample } from "./workflow-examples/fullscreen-modal-example"

const meta = {
  title: "Workflow Examples/With Fullscreen Modal",
  component: FullscreenModalExample,
} satisfies Meta<typeof FullscreenModalExample>

export default meta
type Story = StoryObj<typeof meta>

export const WithFullscreenModal: Story = {}

/**
 * Interaction test ported from the former apps/web Playwright spec
 * (workflow-modal.spec.ts): opening the fullscreen modal keeps the whole editor
 * mounted and interactive inside the dialog.
 */
export const OpensFullscreenEditor: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(
      await canvas.findByRole("button", { name: "Open fullscreen workflow" })
    )

    // The dialog renders in a portal, so query the whole document.
    const dialog = await screen.findByRole("dialog", {
      name: "Fullscreen workflow modal",
    })
    await expect(dialog).toBeVisible()

    const withinDialog = within(dialog)
    await waitFor(() =>
      expect(withinDialog.getAllByTestId("workflow-node")).toHaveLength(5)
    )

    await userEvent.click(
      withinDialog.getByRole("button", { name: "Add Result node" })
    )
    await waitFor(() =>
      expect(withinDialog.getAllByTestId("workflow-node")).toHaveLength(6)
    )

    await userEvent.click(
      withinDialog.getByRole("button", { name: "Hide node palette" })
    )
    await waitFor(() =>
      expect(
        withinDialog.queryByRole("complementary", { name: "Node palette" })
      ).not.toBeInTheDocument()
    )
  },
}
