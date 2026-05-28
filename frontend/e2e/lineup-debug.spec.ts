import { test, expect } from "@playwright/test";

test.describe("Lineup debug", () => {
  test("click + on available player", async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto("http://localhost:3002/login");
    await page.fill('input[type="email"]', 'admin@coachos.dev');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    await page.goto("http://localhost:3002/coach/matches");
    await page.waitForTimeout(2000);
    
    // Click first match card
    const firstCard = page.locator('[class*="cursor-pointer"]').first();
    await firstCard.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/match-detail.png' });
    
    const plusButton = page.locator('button:has-text("+")').first();
    if (await plusButton.count() === 0) {
      console.log('No + button found');
      return;
    }
    console.log('Clicking + button...');
    await plusButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/lineup-after-click.png' });
  });
});
