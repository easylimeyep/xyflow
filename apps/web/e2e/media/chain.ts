import { expect, type Page } from "@playwright/test"

import { pause, type Box } from "./recorder"

export const CHAIN_NODE_IDS = [
  "tour-keyword",
  "tour-extract",
  "tour-setter",
  "tour-result",
] as const

export type ChainNodeId = (typeof CHAIN_NODE_IDS)[number]

export interface TourChain {
  boxes: Record<ChainNodeId, Box>
  top: number
  bottom: number
}

export function chainNode(page: Page, id: ChainNodeId) {
  return page.locator(`.react-flow__node[data-id="${id}"]`)
}

/**
 * Opens the /tour/chain fixture with the palette hidden and the laid-out
 * chain fitted to the canvas, and measures its nodes.
 */
export async function openTourChain(page: Page): Promise<TourChain> {
  await page.goto("/tour/chain")
  await expect(page.getByTestId("workflow-node")).toHaveCount(
    CHAIN_NODE_IDS.length
  )

  const palette = page.getByRole("complementary", { name: "Node palette" })
  await page.getByRole("button", { name: "Hide node palette" }).click()
  await expect(palette).toBeHidden()

  // The page lays the chain out once nodes are measured; until then every
  // node sits at the origin.
  await expect(chainNode(page, "tour-result")).not.toHaveCSS(
    "transform",
    /translate\(0px, 0px\)/
  )
  await page.getByRole("button", { name: "Fit view" }).click()
  await pause(page, 600)

  const entries = await Promise.all(
    CHAIN_NODE_IDS.map(async (id) => {
      const box = await chainNode(page, id).boundingBox()
      if (!box) {
        throw new Error(`Tour chain node "${id}" is not visible`)
      }
      return [id, box] as const
    })
  )
  const boxes = Object.fromEntries(entries) as Record<ChainNodeId, Box>
  const all = Object.values(boxes)

  return {
    boxes,
    top: Math.min(...all.map((box) => box.y)),
    bottom: Math.max(...all.map((box) => box.y + box.height)),
  }
}
