import { expect, test } from "@playwright/test"

import { openTourChain } from "./chain"
import {
  centerOf,
  glide,
  pause,
  placePointer,
  recordTourStep,
} from "./recorder"

// Tour step "workflow-group": with Extractor and Setter selected, group them
// from the selection toolbar (its tooltip shows Ctrl+G), then ungroup with
// Ctrl+Shift+G.
test("record workflow-group", async ({ browser }) => {
  await recordTourStep(browser, "workflow-group", async (recorder) => {
    const { page } = recorder
    const { boxes, top, bottom } = await openTourChain(page)
    const { "tour-keyword": keyword, "tour-extract": extract } = boxes
    const { "tour-setter": setter, "tour-result": result } = boxes
    const toolbar = page.getByRole("group", { name: "Selection actions" })
    const groups = page.getByTestId("workflow-group-frame")

    // Setup, cut from the clip: Shift-drag a box around Extractor and Setter.
    await placePointer(page, { x: extract.x - 28, y: top - 36 })
    await page.keyboard.down("Shift")
    await page.mouse.down()
    await page.mouse.move(setter.x + setter.width + 28, bottom + 36, {
      steps: 12,
    })
    await page.mouse.up()
    await page.keyboard.up("Shift")
    await expect(page.locator(".react-flow__node.selected")).toHaveCount(2)
    await expect(toolbar).toBeVisible()

    // Room above for the toolbar and the group's header, below for the key
    // caption.
    const left = keyword.x - 40
    recorder.setCrop({
      x: left,
      y: top - 140,
      width: result.x + result.width + 40 - left,
      height: bottom - top + 140 + 120,
    })

    await placePointer(page, {
      x: setter.x + setter.width + 60,
      y: bottom + 50,
    })
    await recorder.markStart()
    await pause(page, 800)

    const groupButton = toolbar.getByRole("button", { name: "Group" })
    const groupButtonAt = await centerOf(groupButton)
    await glide(page, groupButtonAt, 800)
    // Let the tooltip with the shortcut come up before clicking.
    await pause(page, 900)
    await page.mouse.down()
    await pause(page, 80)
    await page.mouse.up()
    await expect(groups).toHaveCount(1)

    // The click leaves the pointer on the new group's header controls, and
    // any glide across them opens their tooltips. Hold still, then hop just
    // past the frame's right edge in one move, and glide on from there.
    await pause(page, 700)
    const groupBox = await groups.boundingBox()
    if (!groupBox) {
      throw new Error("The new group frame is not visible")
    }
    await placePointer(page, {
      x: groupBox.x + groupBox.width + 24,
      y: groupButtonAt.y,
    })
    await pause(page, 200)
    await glide(page, { x: result.x + result.width * 0.5, y: bottom + 50 }, 600)
    await pause(page, 700)

    await recorder.showKeys(["Ctrl", "⇧ Shift", "G"])
    await pause(page, 250)
    await page.keyboard.press("Control+Shift+G")
    await expect(groups).toHaveCount(0)
    await pause(page, 900)
    await recorder.hideKeys()
    await pause(page, 1300)
  })
})
