# SauceDemo Checkout Automation

Playwright test for the SauceDemo checkout flow. Written for the TenTwenty QA assessment.

## What it does

Runs three tests:

1. Full checkout with two products (Sauce Labs Backpack and Sauce Labs Fleece Jacket) as the standard user. Checks the cart badge, cart items, order math, success page, and that the cart is empty after the order.
2. Login rejection with wrong password. Checks the error message.
3. A skipped defect reproduction test that sets the session cookie by hand to prove the auth bypass. Off by default. Turn on with an environment variable.

## Setup

You need Node 18 or later.

```
npm install
npx playwright install chromium
```

## Run

Headless:
```
npm test
```

Headed (see the browser):
```
npm run test:headed
```

Open the HTML report after a run:
```
npm run test:report
```

Run the defect reproduction test too:
```
RUN_DEFECT_REPROS=1 npm test
```

On Windows PowerShell:
```
$env:RUN_DEFECT_REPROS = "1"; npm test
```

## Environment variables (optional)

- `SD_USER` and `SD_PASS` override the login credentials. Defaults are `standard_user` and `secret_sauce`.
- `RUN_DEFECT_REPROS=1` enables the auth bypass reproduction test.

## Structure

```
tests/
  checkout.spec.ts        the three tests
  pages/
    LoginPage.ts
    InventoryPage.ts
    CartPage.ts
    CheckoutPage.ts
```

Page objects keep selectors in one place so the tests read like a story of the user journey.

## Design choices

Assertions check business meaning, not just presence. The order total test verifies that subtotal plus tax equals total on the page, so if the app ever ships a broken calculation the test fails immediately. The cart items are compared as a set so the tests do not break if display order changes.

Selectors use the `data-test` attributes the app already exposes. That is stable across style changes.

No hard coded waits. Playwright web first assertions handle the timing.

Tests are independent. Each test uses its own browser context. The full checkout test also verifies the cart is empty after the order, so it works as its own tear down.

## Known limitation

The automation only covers the happy path plus one negative login case. A production suite would add coverage for the sort dropdown, the remove from cart button, checkout cancel, and the defects listed in the main assessment document.
