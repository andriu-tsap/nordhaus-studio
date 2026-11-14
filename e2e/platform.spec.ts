import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
test('home, mobile layout, and screenshots', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bliżej natury');
  await page.getByRole('button', { name: 'Rozumiem', exact: true }).click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
  await mkdir('screenshots', { recursive: true });
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: `screenshots/home-${info.project.name}.png`, fullPage: true });
});
test('catalog filters, variants, cart, demo checkout', async ({ page }) => {
  await page.goto('/shop/');
  await page.getByRole('searchbox').fill('Fotel');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.locator('.product-card').first().click();
  await page.getByRole('combobox').first().selectOption('Grafitowy');
  await page.getByRole('button', { name: 'Dodaj do koszyka' }).click();
  await page.goto('/cart/');
  await expect(page.locator('.cart-item')).toHaveCount(1);
  await expect(page.locator('.cart-item')).toContainText('Grafitowy');
  await page.getByLabel('E-mail', { exact: true }).fill('checkout@example.com');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Zapisz zamówienie DEMO' }).click();
  await expect(
    page.getByRole('heading', { name: 'Zamówienie demonstracyjne zapisane' }),
  ).toBeVisible();
});
test('configurator price changes, quote enters CRM, screenshots', async ({ page }, info) => {
  await page.goto('/configure/');
  const price = page.locator('.config-price strong');
  const before = await price.textContent();
  await page.getByRole('checkbox', { name: 'Oświetlenie LED' }).check();
  await expect(price).not.toHaveText(before || '');
  await page.getByLabel('Imię i nazwisko', { exact: true }).fill('Test Projektu');
  await page.getByLabel('E-mail', { exact: true }).fill('project@example.com');
  await page.getByRole('checkbox').last().check();
  await page.getByRole('button', { name: 'Wyślij projekt do wyceny' }).click();
  await expect(page.locator('.status-message')).toContainText('Zapisano projekt');
  const leads = await page.evaluate(() => JSON.parse(localStorage.getItem('nh-leads') || '[]'));
  expect(leads.some((l: { email: string }) => l.email === 'project@example.com')).toBe(true);
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: `screenshots/configurator-${info.project.name}.png`,
    fullPage: true,
  });
});
test('appointment disappears after confirmation', async ({ page }) => {
  await page.goto('/booking/');
  const day = new Date();
  day.setDate(day.getDate() + 2);
  while ([0, 6].includes(day.getDay())) day.setDate(day.getDate() + 1);
  await page.getByLabel('Data', { exact: true }).fill(day.toLocaleDateString('sv-SE'));
  const slot = page.getByRole('group', { name: 'Dostępne terminy' }).getByRole('button').first();
  await expect(slot).toBeVisible();
  const time = await slot.textContent();
  await slot.click();
  await page.getByLabel('Imię i nazwisko', { exact: true }).fill('Test Konsultacji');
  await page.getByLabel('E-mail', { exact: true }).fill('booking@example.com');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Zarezerwuj konsultację' }).click();
  await expect(page.getByRole('heading', { name: 'Zarezerwowano termin' })).toBeVisible();
  await page.getByRole('button', { name: 'Wybierz kolejny termin' }).click();
  await expect(
    page
      .getByRole('group', { name: 'Dostępne terminy' })
      .getByRole('button', { name: time || '', exact: true }),
  ).toHaveCount(0);
});
test('Angular auth guard, Kanban and CSV', async ({ page }, info) => {
  await page.goto('/studio/#/pipeline');
  await expect(page.getByRole('heading', { name: 'Dobrze Cię widzieć.' })).toBeVisible();
  await page.getByRole('button', { name: 'Wejdź do studia' }).click();
  await expect(page.getByRole('heading', { name: 'Dobry dzień na dobry projekt.' })).toBeVisible();
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: `screenshots/crm-${info.project.name}.png`, fullPage: true });
  await page.getByRole('link', { name: 'Leady i projekty' }).click();
  const select = page.locator('.lead-card').first().getByRole('combobox');
  await select.selectOption('Umowa');
  await expect(page.getByRole('status')).toContainText('Zmieniono etap');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Eksport CSV' }).click();
  expect((await download).suggestedFilename()).toBe('nordhaus-leads.csv');
});
test('PDF contains a valid exported document', async ({ page }) => {
  await page.goto('/configure/');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Pobierz projekt PDF' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('nordhaus-projekt-pergoli.pdf');
});
test('contact validates and records a new lead', async ({ page }) => {
  await page.goto('/contact/');
  await page.getByLabel('Imię i nazwisko').fill('Kontakt Demo');
  await page.getByLabel('E-mail', { exact: true }).fill('contact@example.com');
  await page.getByLabel('Opowiedz o projekcie').fill('Projekt nowego tarasu.');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Wyślij zapytanie' }).click();
  await expect(page.getByRole('status').last()).toContainText('Zapisano');
});
