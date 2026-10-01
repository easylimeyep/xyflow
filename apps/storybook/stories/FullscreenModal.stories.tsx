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

/**
 * The selection toolbar and the editing hotkeys inside the modal: react-aria
 * traps focus in the dialog, so a click on a node must still leave the
 * hotkeys reachable. The toolbar appears for a multi-node selection only; a
 * single node keeps its commands in the context menu.
 */
export const SelectionToolbarInModal: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(
      await canvas.findByRole("button", { name: "Open fullscreen workflow" })
    )
    const dialog = await screen.findByRole("dialog", {
      name: "Fullscreen workflow modal",
    })
    const withinDialog = within(dialog)
    await waitFor(() =>
      expect(withinDialog.getAllByTestId("workflow-node")).toHaveLength(5)
    )

    await userEvent.click(withinDialog.getByText("Needs review"))
    await expect(
      withinDialog.queryByRole("group", { name: "Selection actions" })
    ).not.toBeInTheDocument()

    // React Flow's multi-selection key is Meta on macOS and Control elsewhere;
    // holding both adds the node on any platform.
    await userEvent.keyboard("{Meta>}{Control>}")
    await userEvent.click(withinDialog.getByText("Qualified"))
    await userEvent.keyboard("{/Control}{/Meta}")
    const toolbar = await withinDialog.findByRole("group", {
      name: "Selection actions",
    })
    await expect(toolbar).toBeInTheDocument()

    await userEvent.click(
      within(toolbar).getByRole("button", { name: "Duplicate" })
    )
    await waitFor(() =>
      expect(withinDialog.getAllByTestId("workflow-node")).toHaveLength(7)
    )

    await userEvent.click(
      within(
        await withinDialog.findByRole("group", { name: "Selection actions" })
      ).getByRole("button", { name: "Delete" })
    )
    await waitFor(() =>
      expect(withinDialog.getAllByTestId("workflow-node")).toHaveLength(5)
    )

    await userEvent.click(withinDialog.getByText("Needs review"))
    await userEvent.keyboard("{Control>}d{/Control}")
    await waitFor(() =>
      expect(withinDialog.getAllByTestId("workflow-node")).toHaveLength(6)
    )
  },
}
