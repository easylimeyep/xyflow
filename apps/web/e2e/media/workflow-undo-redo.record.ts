import { expect, test } from "@playwright/test"

import { CHAIN_NODE_IDS, chainNode, openTourChain } from "./chain"
import {
  centerOf,
  glide,
  pause,
  placePointer,
  recordTourStep,
} from "./recorder"

const CHAIN_GAP_BELOW_TOOLBAR = 90

// Tour step "workflow-undo-redo": delete Setter, bring it back with Ctrl+Z,
// remove it again with Ctrl+Shift+Z, then restore it from the toolbar's Undo
// button (its tooltip shows the shortcut).
test("record workflow-undo-redo", async ({ browser }) => {
  await recordTourStep(browser, "workflow-undo-redo", async (recorder) => {
    const { page } = recorder
    const chain = await openTourChain(page)
    const nodes = page.getByTestId("workflow-node")
    const canvas = page.getByRole("region", { name: "Workflow canvas" })
    const undoButton = page.getByRole("button", { name: "Undo" })
    const toolbar = page.getByRole("toolbar", { name: "Editor actions" })

    const canvasBox = await canvas.boundingBox()
    if (!canvasBox) {
      throw new Error("Workflow canvas is not visible")
    }
    const toolbarBox = await toolbar.boundingBox()
    if (!toolbarBox) {
      throw new Error("Editor toolbar is not visible")
    }

    // Setup, cut from the clip: the fitted chain sits mid-canvas, far below
    // the toolbar. Pan it up so both fit a short clip.
    const panBy =
      chain.top - (toolbarBox.y + toolbarBox.height + CHAIN_GAP_BELOW_TOOLBAR)
    const grabAt = {
      x: canvasBox.x + canvasBox.width * 0.5,
      y: chain.bottom + 60,
    }
    await placePointer(page, grabAt)
    await page.mouse.down()
    await page.mouse.move(grabAt.x, grabAt.y - panBy, { steps: 12 })
    await page.mouse.up()
    await pause(page, 300)

    const setter = await chainNode(page, "tour-setter").boundingBox()
    if (!setter) {
      throw new Error('Tour chain node "tour-setter" is not visible')
    }
    const bottom = chain.bottom - panBy

    // From the toolbar at the top down to just below the chain, clear of the
    // minimap in the bottom-left corner.
    recorder.setCrop({
      x: canvasBox.x,
      y: 0,
      width: canvasBox.width,
      height: bottom + 130,
    })

    // Click the node's title, clear of its inputs.
    const setterTitle = { x: setter.x + 40, y: setter.y + 14 }
    const restAt = { x: setter.x + setter.width + 80, y: bottom + 50 }

    await placePointer(page, restAt)
    await recorder.markStart()
    await pause(page, 700)

    await glide(page, setterTitle, 700)
    await pause(page, 200)
    await page.mouse.down()
    await pause(page, 80)
    await page.mouse.up()
    await expect(chainNode(page, "tour-setter")).toHaveClass(/selected/)
    await pause(page, 500)

    await recorder.showKeys(["Delete"])
    await pause(page, 250)
    await page.keyboard.press("Delete")
    await expect(nodes).toHaveCount(CHAIN_NODE_IDS.length - 1)
    await pause(page, 700)
    await recorder.hideKeys()

    await glide(page, restAt, 600)
    await pause(page, 400)

    await recorder.showKeys(["Ctrl", "Z"])
    await pause(page, 250)
    await page.keyboard.press("Control+Z")
    await expect(nodes).toHaveCount(CHAIN_NODE_IDS.length)
    await pause(page, 900)
    await recorder.hideKeys()
    await pause(page, 300)

    await recorder.showKeys(["Ctrl", "⇧ Shift", "Z"])
    await pause(page, 250)
    await page.keyboard.press("Control+Shift+Z")
    await expect(nodes).toHaveCount(CHAIN_NODE_IDS.length - 1)
    await pause(page, 900)
    await recorder.hideKeys()

    // Let the tooltip with the shortcut come up before clicking.
    await glide(page, await centerOf(undoButton), 900)
    await pause(page, 900)
    await page.mouse.down()
    await pause(page, 80)
    await page.mouse.up()
    await expect(nodes).toHaveCount(CHAIN_NODE_IDS.length)
    await pause(page, 600)

    await glide(page, restAt, 800)
    await pause(page, 1500)
  })
})
