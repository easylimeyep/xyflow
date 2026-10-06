import { expect, test } from "@playwright/test"

import { CHAIN_NODE_IDS, chainNode, openTourChain } from "./chain"
import { glide, pause, placePointer, recordTourStep } from "./recorder"

// Tour step "workflow-copy-paste": select Setter, Ctrl+C, move the pointer to
// an empty spot, Ctrl+V — the copy lands under the pointer.
test("record workflow-copy-paste", async ({ browser }) => {
  await recordTourStep(browser, "workflow-copy-paste", async (recorder) => {
    const { page } = recorder
    const { boxes, top, bottom } = await openTourChain(page)
    const { "tour-extract": extract, "tour-setter": setter } = boxes
    const { "tour-result": result } = boxes
    const nodes = page.getByTestId("workflow-node")

    // A paste lands with its top-left corner at the pointer.
    const pasteAt = { x: setter.x - 40, y: bottom + 70 }
    // Start at Extractor: below Keyword sits the minimap.
    const left = extract.x - 40
    recorder.setCrop({
      x: left,
      y: top - 40,
      width: result.x + result.width + 40 - left,
      height: pasteAt.y + setter.height + 120 - (top - 40),
    })

    // Click the node's title, clear of its inputs.
    const setterTitle = { x: setter.x + 40, y: setter.y + 14 }

    await placePointer(page, { x: setter.x - 70, y: bottom + 40 })
    await recorder.markStart()
    await pause(page, 700)

    await glide(page, setterTitle, 700)
    await pause(page, 200)
    await page.mouse.down()
    await pause(page, 80)
    await page.mouse.up()
    await expect(chainNode(page, "tour-setter")).toHaveClass(/selected/)
    await pause(page, 500)

    await recorder.showKeys(["Ctrl", "C"])
    await pause(page, 250)
    await page.keyboard.press("Control+C")
    await pause(page, 700)
    await recorder.hideKeys()

    await glide(page, pasteAt, 900)
    await pause(page, 300)
    await recorder.showKeys(["Ctrl", "V"])
    await pause(page, 250)
    await page.keyboard.press("Control+V")
    await expect(nodes).toHaveCount(CHAIN_NODE_IDS.length + 1)
    await pause(page, 900)
    await recorder.hideKeys()

    await glide(page, { x: pasteAt.x + 230, y: pasteAt.y + 60 }, 500)
    await pause(page, 1500)
  })
})
