import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { InventoryPage } from './pages/InventoryPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';

/**
 * E2E: standard_user completes checkout with two products.
 *
 * Flow: login → add Backpack ($29.99) + Fleece Jacket ($49.99)
 *       → cart → checkout step 1 → step 2 → verify totals math → finish → success.
 *
 * Assertions focus on business-meaningful state:
 * - Cart badge count matches items added
 * - Cart page lists the exact products added (order-agnostic)
 * - Order summary math is internally consistent (subtotal + tax === total)
 * - Success page reached with correct URL and header text
 */
test.describe('SauceDemo checkout — standard_user', () => {
  const USERNAME = process.env.SD_USER ?? 'standard_user';
  const PASSWORD = process.env.SD_PASS ?? 'secret_sauce';

  test('completes a two-item order and totals are internally consistent', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await loginPage.goto();
    await loginPage.login(USERNAME, PASSWORD);

    await inventoryPage.expectLoaded();

    const productA = 'Sauce Labs Backpack';
    const productB = 'Sauce Labs Fleece Jacket';
    const priceA = 29.99;
    const priceB = 49.99;
    const expectedSubtotal = priceA + priceB;

    await inventoryPage.addProduct(productA);
    await inventoryPage.addProduct(productB);
    await inventoryPage.expectCartBadgeCount(2);

    await inventoryPage.openCart();
    await cartPage.expectLoaded();
    await cartPage.expectItemNames([productA, productB]);
    await cartPage.checkout();

    await checkoutPage.fillCustomerInfo('Hamza', 'Mazhar', '46000');

    await checkoutPage.assertTotals(expectedSubtotal, 0.08);
    await checkoutPage.finish();
    await checkoutPage.expectOrderComplete();

    // PDF receipt affordance is exposed on the order-complete page after a real order.
    await checkoutPage.expectPdfReceiptAffordanceVisible();

    // Post-condition: cart is emptied after successful order
    await page.goto('/inventory.html');
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveCount(0);
  });

  test('rejects login with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'wrong_password');
    await expect(loginPage.errorMessage).toContainText(/Username and password do not match/i);
  });

  test('DEFECT REPRO: cookie-only session grants access without login', async ({ page, context }) => {
    // This test intentionally documents a security defect: setting the
    // session-username cookie manually bypasses the login flow entirely.
    // Marked to skip by default to avoid asserting broken behavior in CI.
    test.skip(!process.env.RUN_DEFECT_REPROS, 'set RUN_DEFECT_REPROS=1 to reproduce the defect');

    await context.addCookies([{
      name: 'session-username',
      value: 'standard_user',
      domain: 'www.saucedemo.com',
      path: '/',
    }]);
    await page.goto('/inventory.html');
    await expect(page).toHaveURL(/\/inventory\.html/);
    await expect(page.locator('[data-test="inventory-list"]')).toBeVisible();
  });
});
