import { Page, Locator, expect } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly checkoutButton: Locator;
  readonly items: Locator;

  constructor(page: Page) {
    this.page = page;
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.items = page.locator('[data-test="inventory-item"]');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/cart\.html/);
  }

  async expectItemNames(names: string[]) {
    const shown = await this.page.locator('[data-test="inventory-item-name"]').allTextContents();
    expect(new Set(shown)).toEqual(new Set(names));
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}
