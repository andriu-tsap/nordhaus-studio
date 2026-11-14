import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom, catchError, switchMap, throwError, from } from 'rxjs';
import {
  demoLeads,
  priceBook,
  leadsCsv,
  type Lead,
  type Booking,
  type PriceBook,
} from '@nordhaus/domain';
export const API = (window as Window & { NORDHAUS_API_URL?: string }).NORDHAUS_API_URL || '';
function local<T>(key: string, defaultValue: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? defaultValue;
  } catch {
    return defaultValue;
  }
}
@Injectable({ providedIn: 'root' })
export class Session {
  http = inject(HttpClient);
  token = signal('');
  role = signal('');
  logged = signal(!API && sessionStorage.getItem('nh-demo-session') === 'yes');
  async login(email: string, password: string) {
    if (!API) {
      if (email !== 'demo' || password !== 'demo123') throw new Error('Użyj demo / demo123');
      sessionStorage.setItem('nh-demo-session', 'yes');
      this.logged.set(true);
      this.role.set('admin');
      return;
    }
    const result = await firstValueFrom(
      this.http.post<{ accessToken: string; role: string }>(
        API + '/auth/login',
        { email, password },
        { withCredentials: true },
      ),
    );
    this.token.set(result.accessToken);
    this.role.set(result.role);
    this.logged.set(true);
  }
  async refresh() {
    if (!API) return this.logged();
    try {
      const result = await firstValueFrom(
        this.http.post<{ accessToken: string; role: string }>(
          API + '/auth/refresh',
          {},
          { withCredentials: true },
        ),
      );
      this.token.set(result.accessToken);
      this.role.set(result.role);
      this.logged.set(true);
      return true;
    } catch {
      this.logged.set(false);
      this.token.set('');
      return false;
    }
  }
  async logout() {
    if (API)
      await firstValueFrom(
        this.http.post(API + '/auth/logout', {}, { withCredentials: true }),
      ).catch(() => {});
    this.logged.set(false);
    this.token.set('');
    sessionStorage.removeItem('nh-demo-session');
  }
}
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const s = inject(Session);
  const authenticated = req.url.startsWith(API) && !!API && !req.url.includes('/auth/');
  const signed = authenticated
    ? req.clone({ setHeaders: { Authorization: `Bearer ${s.token()}` }, withCredentials: true })
    : req;
  return next(signed).pipe(
    catchError((err: HttpErrorResponse) => {
      if (authenticated && err.status === 401)
        return from(s.refresh()).pipe(
          switchMap((ok) =>
            ok
              ? next(
                  req.clone({
                    setHeaders: { Authorization: `Bearer ${s.token()}` },
                    withCredentials: true,
                  }),
                )
              : throwError(() => err),
          ),
        );
      return throwError(() => err);
    }),
  );
};
export const authGuard: CanActivateFn = async () => {
  const s = inject(Session),
    r = inject(Router);
  if (s.logged() || (await s.refresh())) return true;
  return r.createUrlTree(['/login']);
};
@Injectable({ providedIn: 'root' })
export class Data {
  http = inject(HttpClient);
  session = inject(Session);
  leads = signal<Lead[]>(local('nh-leads', demoLeads));
  bookings = signal<Booking[]>(local('nh-bookings', []));
  prices = signal<PriceBook>(local('nh-priceBook', priceBook));
  notice = signal('');
  error = signal('');
  pythonReport = signal<{ pipeline: number; won: number; conversion: number } | null>(null);
  total = computed(() => this.leads().reduce((sum, l) => sum + l.value, 0));
  won = computed(() =>
    this.leads()
      .filter((l) => l.stage === 'Umowa')
      .reduce((sum, l) => sum + l.value, 0),
  );
  constructor() {
    window.addEventListener('storage', () => {
      if (!API) {
        this.leads.set(local('nh-leads', demoLeads));
        this.bookings.set(local('nh-bookings', []));
      }
    });
  }
  async load() {
    if (!API) return;
    try {
      const [leads, bookings, prices] = await Promise.all([
        firstValueFrom(this.http.get<Lead[]>(API + '/leads')),
        firstValueFrom(this.http.get<Booking[]>(API + '/bookings')),
        firstValueFrom(this.http.get<PriceBook>(API + '/pricing')),
      ]);
      this.leads.set(leads);
      this.bookings.set(bookings);
      this.prices.set(prices);
      this.error.set('');
    } catch {
      this.error.set('Nie udało się pobrać danych. Sprawdź API i uprawnienia.');
    }
  }
  async connect() {
    if (!API) return;
    const { io } = await import('socket.io-client');
    const socket = io(API, { auth: { token: this.session.token() }, transports: ['websocket'] });
    socket.on('notification', (n: { event: string }) => {
      this.notice.set(n.event);
      void this.load();
    });
    socket.on('connect_error', () =>
      this.notice.set('Powiadomienia offline — dane odświeżysz ręcznie.'),
    );
  }
  async move(id: string, stage: Lead['stage']) {
    try {
      if (API) await firstValueFrom(this.http.patch(API + '/leads/' + id, { stage }));
      this.leads.update((rows) => rows.map((l) => (l.id === id ? { ...l, stage } : l)));
      if (!API) localStorage.setItem('nh-leads', JSON.stringify(this.leads()));
      this.notice.set('Zmieniono etap zapytania.');
    } catch {
      this.error.set('Nie udało się zmienić etapu.');
    }
  }
  async savePrices(prices: PriceBook) {
    if (API) await firstValueFrom(this.http.patch(API + '/pricing', prices));
    this.prices.set(prices);
    if (!API) localStorage.setItem('nh-priceBook', JSON.stringify(prices));
    this.notice.set('Zapisano cennik.');
  }
  export() {
    const blob = new Blob([leadsCsv(this.leads())], { type: 'text/csv;charset=utf-8' });
    download(blob, 'nordhaus-leads.csv');
  }
  async pdf(lead: Lead, invoice = false) {
    try {
      if (API && !invoice) {
        const blob = await firstValueFrom(
          this.http.get(API + `/leads/${lead.id}/pdf`, { responseType: 'blob' }),
        );
        download(blob, 'nordhaus-oferta.pdf');
        return;
      }
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      const font = await fetch('../fonts/DejaVuSans.ttf').then((r) => {
        if (!r.ok) throw new Error();
        return r.arrayBuffer();
      });
      let binary = '';
      new Uint8Array(font).forEach((b) => (binary += String.fromCharCode(b)));
      pdf.addFileToVFS('font.ttf', btoa(binary));
      pdf.addFont('font.ttf', 'Nordhaus', 'normal');
      pdf.setFont('Nordhaus');
      pdf.setFontSize(22);
      pdf.text(invoice ? 'FAKTURA DEMO' : 'OFERTA DEMO', 18, 28);
      pdf.setFontSize(11);
      let y = 48;
      for (const text of [
        'Nordhaus Studio — fikcyjna marka',
        `Numer: ${lead.id}`,
        `Klient: ${lead.name}`,
        `E-mail: ${lead.email}`,
        `Wartość brutto: ${(lead.value / 100).toFixed(2)} PLN`,
        `W tym VAT 23%: ${((lead.value * 23) / 123 / 100).toFixed(2)} PLN`,
        'Dokument demonstracyjny. Nie jest dokumentem księgowym.',
        'Cena bez montażu. Nie stanowi oferty handlowej.',
      ]) {
        pdf.text(text, 18, y);
        y += 12;
      }
      pdf.save(invoice ? 'nordhaus-faktura-demo.pdf' : 'nordhaus-oferta.pdf');
    } catch {
      this.error.set('Nie udało się wygenerować PDF. Oferta API wymaga konfiguracji produktu.');
    }
  }
  async reports() {
    if (API) {
      try {
        this.pythonReport.set(
          await firstValueFrom(
            this.http.get<{ pipeline: number; won: number; conversion: number }>(API + '/reports'),
          ),
        );
      } catch {
        this.error.set('Usługa raportowa Python jest niedostępna.');
      }
    }
  }
}
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
