import { describe, it, expect, beforeAll } from 'vitest';
import { employees, availableSlots, defaultConfiguration } from '@nordhaus/domain';
const url = process.env.API_TEST_URL;
const suite = url ? describe : describe.skip;
let token = '';
suite('HTTP API with PostgreSQL', () => {
  beforeAll(async () => {
    const response = await fetch(url + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
        password: process.env.SEED_ADMIN_PASSWORD,
      }),
    });
    expect(response.status).toBe(201);
    token = (await response.json()).accessToken;
  });
  it('provides health and OpenAPI', async () => {
    expect((await fetch(url + '/health')).ok).toBe(true);
    expect((await fetch(url + '/docs-json')).ok).toBe(true);
  });
  it('denies access without JWT', async () =>
    expect((await fetch(url + '/leads')).status).toBe(401));
  it('rejects invalid DTOs and unlisted fields', async () => {
    const r = await fetch(url + '/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'x', email: 'invalid', message: '', stage: 'Umowa' }),
    });
    expect(r.status).toBe(400);
  });
  it('creates and updates a lead with server-side pricing', async () => {
    const r = await fetch(url + '/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Integracyjny',
        email: 'integration@example.com',
        message: 'Testowy projekt',
        configuration: defaultConfiguration,
      }),
    });
    expect(r.status).toBe(201);
    const { id } = await r.json();
    const change = await fetch(url + '/leads/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ stage: 'Oferta' }),
    });
    expect(change.ok).toBe(true);
    const data = await change.json();
    expect(data.value).toBe(1830240);
    expect(data.stage).toBe('Oferta');
    const pdf = await fetch(url + '/leads/' + id + '/pdf', {
      headers: { Authorization: 'Bearer ' + token },
    });
    expect(pdf.headers.get('content-type')).toContain('application/pdf');
    expect((await pdf.arrayBuffer()).byteLength).toBeGreaterThan(1000);
  });
  it('atomically prevents two concurrent appointments', async () => {
    const day = '2030-11-18';
    const start = availableSlots(day, employees[0], [], new Date('2026-01-01'))[0];
    const call = () =>
      fetch(url + '/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test rezerwacji',
          email: 'race@example.com',
          employee: employees[0],
          start,
        }),
      });
    const responses = await Promise.all([call(), call()]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
  });
  it('blocks live payment setup and unknown products', async () => {
    const r = await fetch(url + '/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        items: [{ productId: 'unknown', quantity: 1, color: 'x', size: 'x' }],
      }),
    });
    expect(r.status).toBe(400);
  });
  it('rejects untrusted cross-origin mutations', async () => {
    const r = await fetch(url + '/auth/refresh', {
      method: 'POST',
      headers: { Origin: 'https://untrusted.example' },
    });
    expect(r.status).toBe(403);
  });
});
