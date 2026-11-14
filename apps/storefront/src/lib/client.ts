import type { Booking, Lead, Configuration, CartItem } from '@nordhaus/domain';
import { calculatePrice, availableSlots, demoLeads, employees, priceBook } from '@nordhaus/domain';
export const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const asset = (name: string) => `${base}/images/${name.replace(/\.jpg$/, '.webp')}`;
export const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
export function readLocal<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}
export function writeLocal(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}
export async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: 'Błąd połączenia' }));
    throw new Error(
      Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message || 'Nie udało się zapisać',
    );
  }
  return response.json();
}
export async function getSlots(day: string, employee: string) {
  return apiUrl
    ? request<string[]>(
        `/bookings/slots?day=${encodeURIComponent(day)}&employee=${encodeURIComponent(employee)}`,
      )
    : availableSlots(day, employee, readLocal<Booking[]>('nh-bookings', []));
}
export async function book(input: Omit<Booking, 'id'>) {
  if (apiUrl) return request<Booking>('/bookings', input);
  const bookings = readLocal<Booking[]>('nh-bookings', []);
  const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(
    new Date(input.start),
  );
  if (
    !availableSlots(day, input.employee, bookings).includes(input.start) ||
    !employees.includes(input.employee)
  )
    throw new Error('Ten termin jest już niedostępny. Wybierz inny.');
  const result = { ...input, id: crypto.randomUUID() };
  writeLocal('nh-bookings', [...bookings, result]);
  return result;
}
export async function saveLead(input: {
  name: string;
  email: string;
  message: string;
  configuration?: Configuration;
}) {
  if (apiUrl) return request<{ id: string }>('/leads', input);
  const lead: Lead = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email,
    stage: 'Nowy',
    value: input.configuration
      ? calculatePrice(input.configuration, readLocal('nh-priceBook', priceBook)).gross
      : 0,
    source: input.configuration ? 'Konfigurator 3D' : 'Formularz',
    createdAt: new Date().toISOString(),
  };
  writeLocal('nh-leads', [...readLocal<Lead[]>('nh-leads', demoLeads), lead]);
  return lead;
}
export async function checkout(items: CartItem[], email: string) {
  if (apiUrl) return request<{ url: string }>('/checkout', { items, email });
  const id = crypto.randomUUID();
  writeLocal('nh-orders', [
    ...readLocal<unknown[]>('nh-orders', []),
    { id, items, email, status: 'DEMO — bez płatności', date: new Date().toISOString() },
  ]);
  return { url: '', id };
}
