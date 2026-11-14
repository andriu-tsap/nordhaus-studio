import { describe, it, expect } from 'vitest';
import {
  calculatePrice,
  defaultConfiguration,
  priceBook,
  cartTotal,
  availableSlots,
  employees,
  leadsCsv,
  demoLeads,
  validateConfiguration,
} from '@nordhaus/domain';
describe('Money and configuration', () => {
  it('calculates integer grosze and VAT', () => {
    expect(calculatePrice(defaultConfiguration)).toEqual({
      net: 1488000,
      vat: 342240,
      gross: 1830240,
      area: 12,
    });
  });
  it('uses every roof rate', () => {
    for (const roof of ['louvres', 'glass', 'polycarbonate'] as const)
      expect(calculatePrice({ ...defaultConfiguration, roof }).net).toBe(
        priceBook.base + 12 * priceBook.perM2[roof],
      );
  });
  it('adds LED and blinds before tax', () => {
    expect(calculatePrice({ ...defaultConfiguration, led: true, blinds: true }).net).toBe(2008000);
  });
  it('uses updated price book', () => {
    expect(calculatePrice(defaultConfiguration, { ...priceBook, base: 500000 }).net).toBe(1568000);
  });
  it.each([NaN, Infinity, 0, 2.99, 7.01])('rejects invalid width %s', (width) => {
    expect(() => validateConfiguration({ ...defaultConfiguration, width })).toThrow();
  });
  it('rejects unknown roof and color', () => {
    expect(() =>
      validateConfiguration({ ...defaultConfiguration, roof: 'x' as 'glass' }),
    ).toThrow();
    expect(() => validateConfiguration({ ...defaultConfiguration, ral: '#ffffff' })).toThrow();
  });
});
describe('Cart integrity', () => {
  const item = { productId: 'fotel-ora', quantity: 2, color: 'Piaskowy', size: 'Standard' };
  it('prices on the server catalog', () => expect(cartTotal([item])).toBe(498000));
  it('handles empty cart', () => expect(cartTotal([])).toBe(0));
  it.each([0, -1, 1.2, 21, NaN])('rejects invalid quantity %s', (quantity) =>
    expect(() => cartTotal([{ ...item, quantity }])).toThrow(),
  );
  it('rejects unknown variants and products', () => {
    expect(() => cartTotal([{ ...item, color: 'x' }])).toThrow();
    expect(() => cartTotal([{ ...item, productId: 'missing' }])).toThrow();
  });
});
describe('Warsaw appointments', () => {
  const now = new Date('2026-01-01T00:00:00Z');
  it('uses CET in winter and CEST in summer', () => {
    expect(availableSlots('2026-11-16', employees[0], [], now)[0]).toBe('2026-11-16T08:00:00.000Z');
    expect(availableSlots('2026-07-06', employees[0], [], now)[0]).toBe('2026-07-06T07:00:00.000Z');
  });
  it('blocks weekends and lunch', () => {
    expect(availableSlots('2026-11-15', employees[0], [], now)).toEqual([]);
    expect(availableSlots('2026-11-16', employees[0], [], now)).not.toContain(
      '2026-11-16T11:00:00.000Z',
    );
  });
  it('excludes occupied slots only for the matching employee', () => {
    const start = '2026-11-16T08:00:00.000Z';
    const bookings = [
      { id: '1', employee: employees[0], start, name: 'Test', email: 'test@example.com' },
    ];
    expect(availableSlots('2026-11-16', employees[0], bookings, now)).not.toContain(start);
    expect(availableSlots('2026-11-16', employees[1], bookings, now)).toContain(start);
  });
  it('rejects invalid dates, unknown staff, past hours', () => {
    expect(availableSlots('2026-02-30', employees[0], [], now)).toEqual([]);
    expect(availableSlots('2026-11-16', 'unknown', [], now)).toEqual([]);
    expect(availableSlots('2026-11-16', employees[0], [], new Date('2026-12-01'))).toEqual([]);
  });
});
describe('CSV export', () => {
  it('escapes quotation marks, delimiters, and formula injection', () => {
    const csv = leadsCsv([{ ...demoLeads[0], name: '=HYPERLINK("bad");\n' }]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain(`"'=HYPERLINK(""bad"");\n"`);
  });
});
