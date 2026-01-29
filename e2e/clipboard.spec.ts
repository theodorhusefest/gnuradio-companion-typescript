import { test, expect, Page } from "@playwright/test";

async function addBlockToCanvas(page: Page) {
  const canvas = page.locator(".react-flow");
  const canvasBounds = await canvas.boundingBox();

  const searchInput = page.getByPlaceholder("Search blocks...");
  await searchInput.fill("AGC");

  const blockItem = page.locator('[draggable="true"]').first();
  await blockItem.waitFor({ state: "visible" });

  await blockItem.dragTo(canvas, {
    targetPosition: { x: canvasBounds!.width / 2, y: canvasBounds!.height / 2 },
  });

  await searchInput.clear();
}

test.describe("Clipboard functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".react-flow");
  });

  test("should show context menu on right-click", async ({ page }) => {
    const canvas = page.locator(".react-flow");
    await canvas.click({ button: "right" });

    await expect(page.getByRole("menuitem", { name: /Cut/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Copy/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Paste/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Delete/ })).toBeVisible();
  });

  test("should copy and paste a node", async ({ page }) => {
    await addBlockToCanvas(page);

    const node = page.locator(".react-flow__node").first();
    await node.click();

    await page.keyboard.press("Meta+c");
    await page.keyboard.press("Meta+v");

    await expect(page.locator(".react-flow__node")).toHaveCount(2);
  });

  test("should cut a node", async ({ page }) => {
    await addBlockToCanvas(page);

    const node = page.locator(".react-flow__node").first();
    await node.click();

    await page.keyboard.press("Meta+x");
    await expect(page.locator(".react-flow__node")).toHaveCount(0);

    await page.keyboard.press("Meta+v");
    await expect(page.locator(".react-flow__node")).toHaveCount(1);
  });

  test("should delete a node", async ({ page }) => {
    await addBlockToCanvas(page);

    const node = page.locator(".react-flow__node").first();
    await node.click();

    await page.keyboard.press("Delete");
    await expect(page.locator(".react-flow__node")).toHaveCount(0);
  });
});
