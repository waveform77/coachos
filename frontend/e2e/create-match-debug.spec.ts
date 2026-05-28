import { test, expect } from "@playwright/test";

test.describe("Create match debug", () => {
  test("create match form submits without 400", async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('response', res => {
      if (res.url().includes('/matches') && res.request().method() === 'POST') {
        console.log('CREATE MATCH RESPONSE:', res.status(), res.url());
      }
    });
    
    await page.goto("http://localhost:3002/login");
    await page.fill('input[type="email"]', 'admin@coachos.dev');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    await page.goto("http://localhost:3002/coach/matches");
    await page.waitForTimeout(2000);
    
    await page.click('button:has-text("Добавить матч")');
    await page.waitForTimeout(1000);
    
    await page.fill('input[placeholder="FC Rival..."]', 'Тестовый соперник');
    await page.fill('input[type="datetime-local"]', '2026-07-01T18:00');
    await page.fill('input[placeholder*="Стадион"]', 'Тестовый стадион');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: '/tmp/create-match-result.png' });
  });
});
