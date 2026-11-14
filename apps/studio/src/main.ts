import { Component, inject, signal, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';
registerLocaleData(localePl);
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { authGuard, authInterceptor, Session, Data, API } from './state';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: ` @if (session.logged()) {
      <div class="app" [class.dark]="dark()">
        <aside class="sidebar">
          <a class="brand" routerLink="/">nordhaus<span>STUDIO / WORKSPACE</span></a
          ><span class="workspace-label">ZARZĄDZANIE</span>
          <nav aria-label="Panel firmy">
            <a routerLink="/" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="active"
              ><span>◫</span> Przegląd</a
            ><a routerLink="/pipeline" routerLinkActive="active"><span>▥</span> Leady i projekty</a
            ><a routerLink="/calendar" routerLinkActive="active"><span>▦</span> Kalendarz</a
            ><a routerLink="/customers" routerLinkActive="active"><span>◎</span> Klienci</a
            ><a routerLink="/pricing" routerLinkActive="active"><span>≡</span> Cennik</a>
          </nav>
          <div class="sidebar-bottom">
            <a href="../">↗ Otwórz witrynę</a
            ><button (click)="dark.set(!dark())">
              {{ dark() ? '☀ Jasny motyw' : '◐ Ciemny motyw' }}</button
            ><button (click)="logout()">Wyloguj się ↗</button>
          </div>
        </aside>
        <div class="main">
          <header class="topbar">
            <span>Nordhaus / Panel firmy</span>
            <div>
              <span class="mode">{{ api ? 'API' : 'DEMO' }}</span><span class="avatar">AT</span
              ><button class="top-logout" (click)="logout()">Wyloguj</button>
            </div>
          </header>
          <div class="content">
            <div class="demo-note">
              {{
                api
                  ? 'Połączono z API. Płatności wyłącznie testowe.'
                  : 'Dane demonstracyjne — fikcyjna firma. Zmiany są zapisywane w tej przeglądarce.'
              }}
            </div>
            @if (data.notice()) {
              <div class="notice" role="status">{{ data.notice() }}</div>
            }
            @if (data.error()) {
              <div class="error" role="alert">{{ data.error() }}</div>
            }
            <router-outlet />
          </div>
          <footer>Projekt koncepcyjny Andrii Tsap · Nordhaus Studio · 2026</footer>
        </div>
      </div>
    } @else {
      <router-outlet />
    }`,
})
class App {
  session = inject(Session);
  data = inject(Data);
  router = inject(Router);
  api = API;
  dark = signal(false);
  async logout() {
    await this.session.logout();
    await this.router.navigate(['/login']);
  }
}
void bootstrapApplication(App, {
  providers: [
    { provide: LOCALE_ID, useValue: 'pl' },
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(
      [
        { path: 'login', loadComponent: () => import('./views').then((m) => m.Login) },
        {
          path: '',
          canActivate: [authGuard],
          loadComponent: () => import('./views').then((m) => m.Dashboard),
        },
        {
          path: 'pipeline',
          canActivate: [authGuard],
          loadComponent: () => import('./views').then((m) => m.Pipeline),
        },
        {
          path: 'calendar',
          canActivate: [authGuard],
          loadComponent: () => import('./views').then((m) => m.Calendar),
        },
        {
          path: 'customers',
          canActivate: [authGuard],
          loadComponent: () => import('./views').then((m) => m.Customers),
        },
        {
          path: 'pricing',
          canActivate: [authGuard],
          loadComponent: () => import('./views').then((m) => m.Pricing),
        },
        { path: '**', redirectTo: '' },
      ],
      withHashLocation(),
    ),
  ],
}).catch(console.error);
import { withHashLocation } from '@angular/router';
