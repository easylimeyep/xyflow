import { expect, test } from "@playwright/test"

test("fullscreen modal editor keeps browser interactions contained", async ({
  page,
}) => {
  await page.goto("/")

  await page.getByRole("tab", { name: "with fullscreen modal" }).click()
  await page.getByRole("button", { name: "Open fullscreen workflow" }).click()

  const dialog = page.getByRole("dialog", {
    name: "Fullscreen workflow modal",
  })
  await expect(dialog).toBeVisible()

  const dialogBox = await dialog.boundingBox()
  const viewport = page.viewportSize()
  expect(dialogBox).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(dialogBox!.width).toBeGreaterThanOrEqual(viewport!.width - 2)
  expect(dialogBox!.height).toBeGreaterThanOrEqual(viewport!.height - 2)

  await expect(dialog.getByTestId("workflow-node")).toHaveCount(5)

  await dialog.getByRole("button", { name: "Add Result node" }).click()
  await expect(dialog.getByTestId("workflow-node")).toHaveCount(6)

  await dialog.getByRole("button", { name: "Hide node palette" }).click()
  await expect(
    dialog.getByRole("complementary", { name: "Node palette" })
  ).toBeHidden()
})
