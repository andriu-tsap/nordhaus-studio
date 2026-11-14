import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CdkDrag, CdkDropList, CdkDropListGroup, CdkDragDrop } from '@angular/cdk/drag-drop';
import { CurrencyPipe } from '@angular/common';
import { stages, type Lead, type Stage, priceBook } from '@nordhaus/domain';
import { Data, Session, API } from './state';
@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `<main class="login">
    <div class="login-art">
      <span>nordhaus / STUDIO</span>
      <div>
        <p>PRZESTRZEŃ DLA DOBRYCH PROJEKTÓW</p>
        <h1>Od pomysłu<br />do realizacji.</h1>
        <p>Jedna platforma. Cały proces.</p>
      </div>
      <small>Projekt koncepcyjny Andrii Tsap</small>
    </div>
    <form class="login-form" [formGroup]="form" (ngSubmit)="submit()">
      <p class="eyebrow">WORKSPACE / {{ api ? 'API' : 'DEMO' }}</p>
      <h2>Dobrze Cię widzieć.</h2>
      <p>
        {{
          api
            ? 'Zaloguj się kontem utworzonym w bazie.'
            : 'Zaloguj się do demonstracyjnego panelu firmy.'
        }}
      </p>
      <label>Login / e-mail<input formControlName="email" autocomplete="username" required /></label
      ><label
        >Hasło<input
          formControlName="password"
          type="password"
          autocomplete="current-password"
          required /></label
      ><button class="primary" [disabled]="form.invalid || busy()">
        {{ busy() ? 'Logowanie…' : 'Wejdź do studia ↗' }}
      </button>
      @if (!api) {
        <p class="hint">Konto demonstracyjne: <strong>demo / demo123</strong></p>
      }
      <p role="alert" class="error">{{ error() }}</p>
      <a href="../">← Wróć do Nordhaus</a>
    </form>
  </main>`,
})
export class Login {
  s = inject(Session);
  router = inject(Router);
  fb = inject(FormBuilder);
  api = API;
  error = signal('');
  busy = signal(false);
  form = this.fb.nonNullable.group({
    email: [API ? '' : 'demo', Validators.required],
    password: [API ? '' : 'demo123', Validators.required],
  });
  async submit() {
    if (this.form.invalid) return;
    this.busy.set(true);
    try {
      const v = this.form.getRawValue();
      await this.s.login(v.email, v.password);
      await this.router.navigate(['/']);
    } catch {
      this.error.set('Nieprawidłowy login lub hasło.');
    } finally {
      this.busy.set(false);
    }
  }
}
@Component({
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  template: `<div class="title-row">
      <div>
        <p class="eyebrow">TWÓJ WORKSPACE</p>
        <h1>Dobry dzień na dobry projekt.</h1>
        <p class="muted">Przegląd zapytań i konsultacji Nordhaus Studio.</p>
      </div>
      <button class="secondary" (click)="data.load()">↻ Odśwież dane</button>
    </div>
    <div class="metrics">
      <article>
        <span>Wartość zapytań</span
        ><strong>{{ data.total() / 100 | currency: 'PLN' : 'symbol' : '1.0-0' }}</strong
        ><small>Wszystkie etapy lejka</small>
      </article>
      <article>
        <span>Etap „Umowa”</span
        ><strong>{{ data.won() / 100 | currency: 'PLN' : 'symbol' : '1.0-0' }}</strong
        ><small>Wartość koncepcyjna, nie przychód</small>
      </article>
      <article>
        <span>Aktywne projekty</span><strong>{{ data.leads().length }}</strong
        ><small>Łącznie w CRM</small>
      </article>
      <article>
        <span>Konsultacje</span><strong>{{ data.bookings().length }}</strong
        ><small>Zapisane rezerwacje</small>
      </article>
    </div>
    <div class="dashboard-grid">
      <article class="panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">LEJEK PROJEKTÓW</p>
            <h2>Każdy etap ma znaczenie.</h2>
          </div>
          <a routerLink="/pipeline">Otwórz CRM ↗</a>
        </div>
        <div class="chart" role="img" aria-label="Liczba zapytań według etapu">
          @for (stage of stages; track stage) {
            <div class="bar-column">
              <strong>{{ count(stage) }}</strong>
              <div class="bar" [style.height.px]="24 + count(stage) * 45"></div>
              <span>{{ stage }}</span>
            </div>
          }
        </div>
        <div class="chart-legend">
          <span>● Dane bieżącego zestawu</span><span>Bez deklarowanych wyników biznesowych</span>
        </div>
      </article>
      <article class="panel">
        <p class="eyebrow">NASTĘPNY KROK</p>
        <h2>Nowe możliwości.</h2>
        @for (lead of data.leads().slice(0, 4); track lead.id) {
          <a class="activity" routerLink="/pipeline"
            ><span class="initial">{{ lead.name.charAt(0) }}</span>
            <div>
              <strong>{{ lead.name }}</strong><small>{{ lead.source }}</small>
            </div>
            <span class="badge">{{ lead.stage }}</span></a
          >
        }
        <a routerLink="/calendar" class="secondary">Zobacz kalendarz ↗</a>
      </article>
    </div>
    <article class="panel report-panel">
      <div>
        <p class="eyebrow">ANALITYKA / PYTHON</p>
        <h2>Struktura lejka.</h2>
        <p>
          Konwersja do etapu „Umowa”: <strong>{{ conversion() }}%</strong>. Obłożenie:
          {{ data.bookings().length }} zarezerwowanych godzin.
        </p>
      </div>
      <button class="secondary" (click)="data.reports()">Pobierz raport API</button>
      @if (data.pythonReport(); as report) {
        <p role="status">
          Python: wartość lejka {{ report.pipeline / 100 | currency: 'PLN' }}, konwersja
          {{ report.conversion }}%.
        </p>
      }
    </article>`,
})
export class Dashboard implements OnInit {
  data = inject(Data);
  stages = stages;
  async ngOnInit() {
    await this.data.load();
    await this.data.connect();
  }
  count(stage: Stage) {
    return this.data.leads().filter((l) => l.stage === stage).length;
  }
  conversion = computed(() =>
    this.data.leads().length
      ? Math.round((this.count('Umowa') / this.data.leads().length) * 100)
      : 0,
  );
}
@Component({
  standalone: true,
  imports: [CdkDrag, CdkDropList, CdkDropListGroup, CurrencyPipe],
  template: `<div class="title-row">
      <div>
        <p class="eyebrow">CRM / PIPELINE</p>
        <h1>Od pierwszego kontaktu.</h1>
        <p class="muted">Przeciągnij kartę lub wybierz etap z listy.</p>
      </div>
      <button class="primary" (click)="data.export()">Eksport CSV ↗</button>
    </div>
    <div class="kanban" cdkDropListGroup>
      @for (stage of stages; track stage) {
        <section
          class="kanban-column"
          cdkDropList
          [cdkDropListData]="stage"
          (cdkDropListDropped)="drop($event)"
        >
          <h2>
            <span>{{ stage }}</span><small>{{ rows(stage).length }}</small>
          </h2>
          @for (lead of rows(stage); track lead.id) {
            <article class="lead-card" cdkDrag [cdkDragData]="lead">
              <span class="lead-source">{{ lead.source }}</span>
              <h3>{{ lead.name }}</h3>
              <a [href]="'mailto:' + lead.email">{{ lead.email }}</a><strong>{{
                lead.value / 100 | currency: 'PLN' : 'symbol' : '1.0-0'
              }}</strong
              ><label
                >Etap<select [value]="lead.stage" (change)="move(lead, $event)">
                  @for (s of stages; track s) {
                    <option [value]="s">{{ s }}</option>
                  }
                </select></label
              >
              <div class="document-buttons">
                <button (click)="data.pdf(lead)">Oferta PDF</button
                ><button (click)="data.pdf(lead, true)">Faktura DEMO</button>
              </div>
            </article>
          }
        </section>
      }
    </div>`,
})
export class Pipeline implements OnInit {
  data = inject(Data);
  stages = stages;
  ngOnInit() {
    void this.data.load();
  }
  rows(stage: Stage) {
    return this.data.leads().filter((l) => l.stage === stage);
  }
  drop(event: CdkDragDrop<Stage, Stage, Lead>) {
    void this.data.move(event.item.data.id, event.container.data);
  }
  move(lead: Lead, event: Event) {
    void this.data.move(lead.id, (event.target as HTMLSelectElement).value as Stage);
  }
}
@Component({
  standalone: true,
  imports: [],
  template: `<div class="title-row">
      <div>
        <p class="eyebrow">KALENDARZ / EUROPE/WARSAW</p>
        <h1>Przestrzeń na rozmowę.</h1>
        <p class="muted">Konsultacje godzinowe, pon.–pt., z przerwą 12:00–13:00.</p>
      </div>
      <a href="../booking/" class="primary">Nowa rezerwacja ↗</a>
    </div>
    <article class="panel">
      <div class="calendar-toolbar">
        <label
          >Filtruj według dnia<input
            type="date"
            [value]="day()"
            (change)="day.set($any($event.target).value)" /></label
        ><button class="secondary" (click)="day.set('')">Wszystkie terminy</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Termin (Warszawa)</th>
              <th>Klient</th>
              <th>Doradca</th>
              <th>Kontakt</th>
            </tr>
          </thead>
          <tbody>
            @for (b of visible(); track b.id) {
              <tr>
                <td>{{ format(b.start) }}</td>
                <td>{{ b.name }}</td>
                <td>{{ b.employee }}</td>
                <td>{{ b.email }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="empty">
                  Brak rezerwacji. Dodaj przykładową konsultację przez stronę publiczną.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </article>`,
})
export class Calendar implements OnInit {
  data = inject(Data);
  day = signal('');
  visible = computed(() =>
    this.data
      .bookings()
      .filter(
        (b) =>
          !this.day() ||
          new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(
            new Date(b.start),
          ) === this.day(),
      ),
  );
  ngOnInit() {
    void this.data.load();
  }
  format(start: string) {
    return new Date(start).toLocaleString('pl-PL', {
      timeZone: 'Europe/Warsaw',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
}
@Component({
  standalone: true,
  imports: [CurrencyPipe],
  template: `<div class="title-row">
      <div>
        <p class="eyebrow">RELACJE / HISTORIA</p>
        <h1>Każdy projekt ma swoją historię.</h1>
      </div>
      <label
        >Szukaj klienta<input
          type="search"
          placeholder="Nazwa lub e-mail"
          (input)="query.set($any($event.target).value)"
      /></label>
    </div>
    <article class="panel">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Klient</th>
              <th>E-mail</th>
              <th>Projekty</th>
              <th>Łączna wartość</th>
              <th>Historia</th>
            </tr>
          </thead>
          <tbody>
            @for (c of customers(); track c.email) {
              <tr>
                <td>{{ c.name }}</td>
                <td>{{ c.email }}</td>
                <td>{{ c.leads.length }}</td>
                <td>{{ c.total / 100 | currency: 'PLN' }}</td>
                <td>
                  <button
                    class="text-button"
                    (click)="selected.set(selected() === c.email ? '' : c.email)"
                  >
                    Pokaż ↗
                  </button>
                </td>
              </tr>
              @if (selected() === c.email) {
                <tr>
                  <td colspan="5">
                    <div class="history">
                      @for (l of c.leads; track l.id) {
                        <p>
                          <span class="badge">{{ l.stage }}</span> {{ l.source }} ·
                          {{ l.value / 100 | currency: 'PLN' }}
                        </p>
                      }
                      @for (b of data.bookings(); track b.id) {
                        @if (b.email === c.email) {
                          <p>Konsultacja: {{ b.start }} · {{ b.employee }}</p>
                        }
                      }
                    </div>
                  </td>
                </tr>
              }
            } @empty {
              <tr>
                <td colspan="5">Brak wyników.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </article>`,
})
export class Customers implements OnInit {
  data = inject(Data);
  query = signal('');
  selected = signal('');
  customers = computed(() => {
    const leads = this.data.leads();
    return [...new Set([...leads.map((l) => l.email), ...this.data.bookings().map((b) => b.email)])]
      .map((email) => {
        const rows = leads.filter((l) => l.email === email);
        return {
          email,
          name: rows[0]?.name || this.data.bookings().find((b) => b.email === email)?.name || email,
          leads: rows,
          total: rows.reduce((s, l) => s + l.value, 0),
        };
      })
      .filter((c) => (c.name + ' ' + c.email).toLowerCase().includes(this.query().toLowerCase()));
  });
  ngOnInit() {
    void this.data.load();
  }
}
@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `<p class="eyebrow">ADMIN / CENNIK</p>
    <h1>Jasne zasady wyceny.</h1>
    <p class="muted">
      Wartości netto w groszach. VAT: 23%. Zmiana nie aktualizuje wcześniej zapisanych zapytań.
    </p>
    <form class="panel price-form" [formGroup]="form" (ngSubmit)="save()">
      <label
        >Baza konstrukcji (gr)<input
          type="number"
          formControlName="base"
          min="100"
          max="10000000"
          required /></label
      ><label
        >Lamele / m² (gr)<input
          type="number"
          formControlName="louvres"
          min="100"
          max="1000000"
          required /></label
      ><label
        >Szkło / m² (gr)<input
          type="number"
          formControlName="glass"
          min="100"
          max="1000000"
          required /></label
      ><label
        >Poliwęglan / m² (gr)<input
          type="number"
          formControlName="polycarbonate"
          min="100"
          max="1000000"
          required /></label
      ><label
        >LED (gr)<input type="number" formControlName="led" min="0" max="1000000" required /></label
      ><label
        >Roleta (gr)<input
          type="number"
          formControlName="blinds"
          min="0"
          max="1000000"
          required /></label
      ><button class="primary" [disabled]="form.invalid || busy()">
        {{ busy() ? 'Zapisywanie…' : 'Zapisz cennik' }}
      </button>
      <p role="status">{{ status() }}</p>
    </form>`,
})
export class Pricing implements OnInit {
  data = inject(Data);
  fb = inject(FormBuilder);
  busy = signal(false);
  status = signal('');
  form = this.fb.nonNullable.group({
    base: [priceBook.base, [Validators.required, Validators.min(100), Validators.max(10000000)]],
    louvres: [
      priceBook.perM2.louvres,
      [Validators.required, Validators.min(100), Validators.max(1000000)],
    ],
    glass: [
      priceBook.perM2.glass,
      [Validators.required, Validators.min(100), Validators.max(1000000)],
    ],
    polycarbonate: [
      priceBook.perM2.polycarbonate,
      [Validators.required, Validators.min(100), Validators.max(1000000)],
    ],
    led: [priceBook.led, [Validators.required, Validators.min(0), Validators.max(1000000)]],
    blinds: [priceBook.blinds, [Validators.required, Validators.min(0), Validators.max(1000000)]],
  });
  async ngOnInit() {
    await this.data.load();
    const p = this.data.prices();
    this.form.patchValue({ ...p, ...p.perM2 });
  }
  async save() {
    if (this.form.invalid) return;
    this.busy.set(true);
    try {
      const v = this.form.getRawValue();
      await this.data.savePrices({
        base: v.base,
        led: v.led,
        blinds: v.blinds,
        vat: 23,
        perM2: { louvres: v.louvres, glass: v.glass, polycarbonate: v.polycarbonate },
      });
      this.status.set('Cennik zapisany.');
    } catch {
      this.status.set('Nie udało się zapisać. Wymagana rola administratora.');
    } finally {
      this.busy.set(false);
    }
  }
}
