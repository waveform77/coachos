import { test, expect } from "@playwright/test";

test.describe("Drag and drop debug", () => {
  test("drag player to pitch", async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto("http://localhost:3002/login");
    await page.fill('input[type="email"]', 'admin@coachos.dev');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    await page.goto("http://localhost:3002/coach/matches");
    await page.waitForTimeout(2000);
    
    const firstCard = page.locator('[class*="cursor-pointer"]').first();
    await firstCard.click();
    await page.waitForTimeout(3000);
    
    const playerDraggable = page.locator('[class*="touch-none"]').filter({ hasText: 'Владислав Орлов' }).first();
    const pitch = page.locator('.bg-emerald-700').first();
    
    await playerDraggable.dragTo(pitch, { force: true, timeout: 5000 });
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/drag-drop-result.png' });
  });
});
