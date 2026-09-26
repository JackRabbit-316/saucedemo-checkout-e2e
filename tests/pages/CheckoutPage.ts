import { Page, Locator, expect } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly errorMessage: Locator;
  readonly completeHeader: Locator;
  readonly generatePdfButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstName = page.locator('[data-test="firstName"]');
    this.lastName = page.locator('[data-test="lastName"]');
    this.postalCode = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.completeHeader = page.locator('[data-test="complete-header"]');
    this.generatePdfButton = page.locator('#generate-pdf-order');
  }

  async fillCustomerInfo(firstName: string, lastName: string, postalCode: string) {
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.postalCode.fill(postalCode);
    await this.continueButton.click();
  }

  async assertTotals(expectedSubtotal: number, taxRate = 0.08) {
    const subtotalText = await this.page.locator('[data-test="subtotal-label"]').textContent();
    const taxText = await this.page.locator('[data-test="tax-label"]').textContent();
    const totalText = await this.page.locator('[data-test="total-label"]').textContent();

    const parse = (t: string | null) => parseFloat((t ?? '').match(/[\d.]+/)?.[0] ?? '0');

    const subtotal = parse(subtotalText);
    const tax = parse(taxText);
    const total = parse(totalText);

    expect(subtotal).toBeCloseTo(expectedSubtotal, 2);
    // Displayed tax should equal subtotal * taxRate within a cent
    expect(tax).toBeCloseTo(expectedSubtotal * taxRate, 2);
    // Displayed total should equal subtotal + tax within a cent (guards the math on the page)
    expect(total).toBeCloseTo(subtotal + tax, 2);
  }

  async finish() {
    await this.finishButton.click();
  }

  async expectOrderComplete() {
    await expect(this.page).toHaveURL(/\/checkout-complete\.html/);
    await expect(this.completeHeader).toHaveText(/Thank you for your order/i);
  }

  async expectPdfReceiptAffordanceVisible() {
    // The order confirmation page exposes a "Generate PDF order" button.
    // We assert the affordance is present after a real order, without
    // triggering the download itself. Download verification is intentionally
    // out of scope here to keep the run fast and headless-friendly.
    await expect(this.generatePdfButton).toBeVisible();
    await expect(this.generatePdfButton).toHaveText(/Generate PDF order/i);
  }
}
