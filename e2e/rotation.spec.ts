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

test.describe("Rotation functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".react-flow");
  });

  test("should rotate node clockwise with R key", async ({ page }) => {
    await addBlockToCanvas(page);

    const node = page.locator(".react-flow__node").first();
    await node.click();

    // Initially input handle should be on the left
    const inputHandle = node.locator(".react-flow__handle-left");
    await expect(inputHandle).toBeVisible();

    await page.keyboard.press("r");

    // After 90° rotation, input handle should be on top
    const topHandle = node.locator(".react-flow__handle-top");
    await expect(topHandle).toBeVisible();
  });

  test("should rotate node counterclockwise with Shift+R", async ({ page }) => {
    await addBlockToCanvas(page);

    const node = page.locator(".react-flow__node").first();
    await node.click();

    await page.keyboard.press("Shift+r");

    // After 270° rotation (counterclockwise from 0), input handle should be on bottom
    const bottomHandle = node.locator(".react-flow__handle-bottom");
    await expect(bottomHandle).toBeVisible();
  });

  test("should show rotation options in context menu", async ({ page }) => {
    const canvas = page.locator(".react-flow");
    await canvas.click({ button: "right" });

    await expect(page.getByRole("menuitem", { name: /Rotate Clockwise/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Rotate Counterclockwise/ })).toBeVisible();
  });

  test("should rotate via toolbar buttons", async ({ page }) => {
    await addBlockToCanvas(page);

    const node = page.locator(".react-flow__node").first();
    await node.click();

    // Click clockwise rotation button in toolbar
    const rotateClockwiseBtn = page.locator("button").filter({ has: page.locator("svg.lucide-rotate-cw") });
    await rotateClockwiseBtn.click();

    // After 90° rotation, input handle should be on top
    const topHandle = node.locator(".react-flow__handle-top");
    await expect(topHandle).toBeVisible();
  });
});
