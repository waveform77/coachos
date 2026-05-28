# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: drag-drop-debug.spec.ts >> Drag and drop debug >> drag player to pitch
- Location: e2e/drag-drop-debug.spec.ts:4:3

# Error details

```
TimeoutError: locator.dragTo: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('[class*="touch-none"]').filter({ hasText: 'Владислав Орлов' }).first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - heading "Unexpected Application Error!" [level=2] [ref=e3]
    - 'heading "Failed to fetch dynamically imported module: http://localhost:3002/src/pages/coach/match-detail.page.tsx?t=1779975362012" [level=3] [ref=e4]'
    - generic [ref=e5]: "TypeError: Failed to fetch dynamically imported module: http://localhost:3002/src/pages/coach/match-detail.page.tsx?t=1779975362012"
    - paragraph [ref=e6]: 💿 Hey developer 👋
    - paragraph [ref=e7]:
      - text: You can provide a way better UX than this when your app throws errors by providing your own
      - code [ref=e8]: ErrorBoundary
      - text: or
      - code [ref=e9]: errorElement
      - text: prop on your route.
    - region "Notifications alt+T"
    - generic [ref=e10]:
      - img [ref=e12]
      - button "Open Tanstack query devtools" [ref=e60] [cursor=pointer]:
        - img [ref=e61]
  - generic [ref=e111]:
    - generic [ref=e112]: "[plugin:vite:react-babel] /Users/pudgero/Desktop/football manager/frontend/src/features/matches/tactical-board.tsx: Unterminated regular expression. (356:14) 359 | {/* Bench / Lists */}"
    - generic [ref=e113]: /Users/pudgero/Desktop/football manager/frontend/src/features/matches/tactical-board.tsx:356:14
    - generic [ref=e114]: "354| ) 355| }) 356| </div> | ^ 357| </div> 358|"
    - generic [ref=e115]: at constructor (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:365:19) at TypeScriptParserMixin.raise (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:6616:19) at TypeScriptParserMixin.readRegexp (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:6345:20) at TypeScriptParserMixin.parseExprAtom (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:11330:16) at TypeScriptParserMixin.parseExprAtom (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:4776:20) at TypeScriptParserMixin.parseExprSubscripts (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:11098:23) at TypeScriptParserMixin.parseUpdate (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:11083:21) at TypeScriptParserMixin.parseMaybeUnary (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:11063:23) at TypeScriptParserMixin.parseMaybeUnary (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:9854:18) at TypeScriptParserMixin.parseMaybeUnaryOrPrivate (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:10916:61) at TypeScriptParserMixin.parseExprOpBaseRightExpr (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:11003:34) at TypeScriptParserMixin.parseExprOpRightExpr (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:10998:21) at TypeScriptParserMixin.parseExprOp (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:10964:27) at TypeScriptParserMixin.parseExprOp (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:9323:18) at TypeScriptParserMixin.parseExprOps (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:10925:17) at TypeScriptParserMixin.parseMaybeConditional (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:10898:23) at TypeScriptParserMixin.parseMaybeAssign (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:10848:21) at TypeScriptParserMixin.parseMaybeAssign (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:9803:20) at TypeScriptParserMixin.parseExpressionBase (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:10801:23) at /Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:10797:39 at TypeScriptParserMixin.allowInAnd (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:12443:12) at TypeScriptParserMixin.parseExpression (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:10797:17) at TypeScriptParserMixin.jsxParseExpressionContainer (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:4644:31) at TypeScriptParserMixin.jsxParseElementAt (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:4723:36) at TypeScriptParserMixin.jsxParseElementAt (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:4710:32) at TypeScriptParserMixin.jsxParseElementAt (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:4710:32) at TypeScriptParserMixin.jsxParseElementAt (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:4710:32) at TypeScriptParserMixin.jsxParseElementAt (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:4710:32) at TypeScriptParserMixin.jsxParseElement (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:4761:17) at TypeScriptParserMixin.parseExprAtom (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:4771:19) at TypeScriptParserMixin.parseExprSubscripts (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:11098:23) at TypeScriptParserMixin.parseUpdate (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:11083:21) at TypeScriptParserMixin.parseMaybeUnary (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:11063:23) at TypeScriptParserMixin.parseMaybeUnary (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:9854:18) at TypeScriptParserMixin.parseMaybeUnaryOrPrivate (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:10916:61) at TypeScriptParserMixin.parseExprOps (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:10921:23) at TypeScriptParserMixin.parseMaybeConditional (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:10898:23) at TypeScriptParserMixin.parseMaybeAssign (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:10848:21) at /Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:9792:39 at TypeScriptParserMixin.tryParse (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:6924:20) at TypeScriptParserMixin.parseMaybeAssign (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:9792:18) at /Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:10817:39 at TypeScriptParserMixin.allowInAnd (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:12443:12) at TypeScriptParserMixin.parseMaybeAssignAllowIn (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:10817:17) at TypeScriptParserMixin.parseMaybeAssignAllowInOrVoidPattern (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:12510:17) at TypeScriptParserMixin.parseParenAndDistinguishExpression (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:11692:28) at TypeScriptParserMixin.parseExprAtom (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:11348:23) at TypeScriptParserMixin.parseExprAtom (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:4776:20) at TypeScriptParserMixin.parseExprSubscripts (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:11098:23) at TypeScriptParserMixin.parseUpdate (/Users/pudgero/Desktop/football manager/frontend/node_modules/@babel/parser/lib/index.js:11083:21
    - generic [ref=e116]:
      - text: Click outside, press Esc key, or fix the code to dismiss.
      - text: You can also disable this overlay by setting
      - code [ref=e117]: server.hmr.overlay
      - text: to
      - code [ref=e118]: "false"
      - text: in
      - code [ref=e119]: vite.config.ts
      - text: .
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Drag and drop debug", () => {
  4  |   test("drag player to pitch", async ({ page }) => {
  5  |     page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  6  |     page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  7  |     
  8  |     await page.goto("http://localhost:3002/login");
  9  |     await page.fill('input[type="email"]', 'admin@coachos.dev');
  10 |     await page.fill('input[type="password"]', 'Admin123!');
  11 |     await page.click('button[type="submit"]');
  12 |     await page.waitForTimeout(2000);
  13 |     
  14 |     await page.goto("http://localhost:3002/coach/matches");
  15 |     await page.waitForTimeout(2000);
  16 |     
  17 |     const firstCard = page.locator('[class*="cursor-pointer"]').first();
  18 |     await firstCard.click();
  19 |     await page.waitForTimeout(3000);
  20 |     
  21 |     const playerDraggable = page.locator('[class*="touch-none"]').filter({ hasText: 'Владислав Орлов' }).first();
  22 |     const pitch = page.locator('.bg-emerald-700').first();
  23 |     
> 24 |     await playerDraggable.dragTo(pitch, { force: true, timeout: 5000 });
     |                           ^ TimeoutError: locator.dragTo: Timeout 5000ms exceeded.
  25 |     
  26 |     await page.waitForTimeout(2000);
  27 |     await page.screenshot({ path: '/tmp/drag-drop-result.png' });
  28 |   });
  29 | });
  30 | 
```