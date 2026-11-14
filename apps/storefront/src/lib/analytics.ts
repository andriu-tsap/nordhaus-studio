/** GA4-ready, network-free adapter. A real tag must only be loaded after valid consent. */
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}
export function track(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer ??= [];
  window.dataLayer.push({ event, ...payload });
}
