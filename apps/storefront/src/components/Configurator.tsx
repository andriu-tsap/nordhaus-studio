'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Component, useState, useEffect, type ReactNode } from 'react';
import { Download, Sun, Moon, RotateCw } from 'lucide-react';
import {
  calculatePrice,
  money,
  defaultConfiguration,
  priceBook,
  type PriceBook,
  type Roof,
} from '@nordhaus/domain';
import { useStore, useT } from '../lib/store';
import { asset, saveLead, apiUrl, readLocal, request } from '../lib/client';
import { exportQuote } from '../lib/pdf';
const Scene = dynamic(() => import('./Scene'), {
  ssr: false,
  loading: () => <div className="scene-loading">Ładowanie modelu 3D…</div>,
});
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-fallback">
        <img src={asset('pergola.svg')} alt="Schemat pergoli" />
        <p>WebGL jest niedostępny. Wycena i konfiguracja działają w trybie 2D.</p>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function Configurator() {
  const { configuration: c, configure } = useStore(),
    t = useT();
  const [open, setOpen] = useState(true),
    [night, setNight] = useState(false),
    [detail, setDetail] = useState(false),
    [status, setStatus] = useState(''),
    [busy, setBusy] = useState(false);
  const [book, setBook] = useState<PriceBook>(priceBook);
  useEffect(() => {
    if (apiUrl)
      request<PriceBook>('/pricing')
        .then(setBook)
        .catch(() => setStatus('Nie udało się pobrać aktualnego cennika. Cena jest orientacyjna.'));
    else setBook(readLocal('nh-priceBook', priceBook));
  }, []);
  const price = calculatePrice(c, book);
  return (
    <section className="config-page">
      <div className="config-title">
        <div>
          <p className="eyebrow">NORD / 01 — {t('KONFIGURATOR 3D', '3D CONFIGURATOR')}</p>
          <h1>
            {t('Twoja przestrzeń.', 'Your space.')} <em>{t('Twój rytm.', 'Your rhythm.')}</em>
          </h1>
        </div>
        <span className="tag">
          {apiUrl ? 'API' : 'DEMO'} · {t('wycena na żywo', 'live pricing')}
        </span>
      </div>
      <div className="config-layout">
        <div className="viewer-column">
          <div className="viewer" id="pergola-viewer">
            <Boundary>
              <Scene c={c} open={open} night={night} detail={detail} />
            </Boundary>
            <div className="viewer-top">
              <span className="tag">
                {c.width} × {c.depth} × {c.height} m
              </span>
              <button className="chip" onClick={() => setNight(!night)} aria-pressed={night}>
                {night ? <Moon size={16} /> : <Sun size={16} />}{' '}
                {night ? t('Noc', 'Night') : t('Dzień', 'Day')}
              </button>
            </div>
            <div className="viewer-bottom">
              <span>
                {t(
                  'Przeciągnij, aby obrócić · gestem przybliżysz',
                  'Drag to rotate · pinch to zoom',
                )}
              </span>
              <button className="chip" onClick={() => configure(defaultConfiguration)}>
                <RotateCw size={14} /> Reset
              </button>
            </div>
          </div>
          <div className="viewer-options">
            <button
              className="chip"
              disabled={c.roof !== 'louvres'}
              aria-pressed={open}
              onClick={() => setOpen(!open)}
            >
              {open ? 'Zamknij lamele' : 'Otwórz lamele'}
            </button>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={detail}
                onChange={(e) => setDetail(e.target.checked)}
              />{' '}
              Detal GLB
            </label>
            <button
              className="chip"
              onClick={async () => {
                setStatus('Generowanie PDF…');
                try {
                  await exportQuote(
                    c,
                    document.querySelector<HTMLCanvasElement>('#pergola-viewer canvas'),
                    book,
                  );
                  setStatus('Pobrano PDF.');
                } catch (e) {
                  setStatus((e as Error).message);
                }
              }}
            >
              <Download size={16} /> {t('Pobierz projekt PDF', 'Download PDF')}
            </button>
          </div>
          <p className="tiny muted">
            {t(
              'Podgląd koncepcyjny. Wymaga weryfikacji konstrukcyjnej i pomiaru na miejscu.',
              'Concept preview. Requires structural verification and on-site measurements.',
            )}
          </p>
        </div>
        <div className="config-controls">
          <p className="eyebrow">01 / {t('WYMIARY', 'DIMENSIONS')}</p>
          {(
            [
              { key: 'width', name: t('Szerokość', 'Width'), min: 3, max: 7 },
              { key: 'depth', name: t('Wysięg', 'Depth'), min: 2, max: 5 },
              { key: 'height', name: t('Wysokość', 'Height'), min: 2.3, max: 3.2 },
            ] as const
          ).map((s) => (
            <label key={s.key} className="range-label">
              <span>
                {s.name}
                <strong>{c[s.key].toFixed(1)} m</strong>
              </span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step="0.1"
                value={c[s.key]}
                onChange={(e) => configure({ [s.key]: Number(e.target.value) })}
              />
            </label>
          ))}
          <p className="eyebrow">02 / {t('WYKOŃCZENIE', 'FINISH')}</p>
          <label>
            {t('Rodzaj dachu', 'Roof type')}
            <select value={c.roof} onChange={(e) => configure({ roof: e.target.value as Roof })}>
              <option value="louvres">Lamele aluminiowe</option>
              <option value="glass">Szkło</option>
              <option value="polycarbonate">Poliwęglan</option>
            </select>
          </label>
          <div className="swatches" role="group" aria-label="Kolor RAL">
            {[
              { hex: '#343b3c', name: 'RAL 7016 · Grafit' },
              { hex: '#ede8de', name: 'RAL 9001 · Krem' },
              { hex: '#867761', name: 'RAL 7006 · Taupe' },
            ].map((v) => (
              <button
                key={v.hex}
                style={{ background: v.hex }}
                title={v.name}
                aria-label={v.name}
                aria-pressed={c.ral === v.hex}
                onClick={() => configure({ ral: v.hex })}
              />
            ))}
          </div>
          <p className="eyebrow">03 / {t('DODATKI', 'EXTRAS')}</p>
          <label className="toggle">
            <span>
              Oświetlenie LED <small>+ {money(Math.round(book.led * 1.23))}</small>
            </span>
            <input
              type="checkbox"
              checked={c.led}
              onChange={(e) => configure({ led: e.target.checked })}
            />
          </label>
          <label className="toggle">
            <span>
              Roleta boczna <small>+ {money(Math.round(book.blinds * 1.23))}</small>
            </span>
            <input
              type="checkbox"
              checked={c.blinds}
              onChange={(e) => configure({ blinds: e.target.checked })}
            />
          </label>
          <div className="config-price">
            <span>{t('Orientacyjna cena brutto', 'Indicative gross price')}</span>
            <strong aria-live="polite">{money(price.gross)}</strong>
            <span className="tiny">{price.area} m² · VAT 23% · bez montażu</span>
          </div>
          <a className="button dark full" href="#quote">
            {t('Porozmawiajmy o projekcie', 'Let’s discuss your design')} ↗
          </a>
        </div>
      </div>
      <form
        id="quote"
        className="quote-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const f = new FormData(e.currentTarget);
          try {
            const lead = await saveLead({
              name: String(f.get('name')),
              email: String(f.get('email')),
              message: String(f.get('message')),
              configuration: c,
            });
            setStatus(
              `Zapisano projekt ${lead.id}. ${apiUrl ? 'Potwierdzenie przyjdzie po przetworzeniu przez serwer.' : 'Tryb DEMO: dane są w przeglądarce, e-mail nie jest wysyłany.'}`,
            );
          } catch (e) {
            setStatus((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div>
          <p className="eyebrow">NASTĘPNY KROK</p>
          <h2>
            {t('Nadaj pomysłowi', 'Give your idea')}
            <br />
            <em>{t('realny kształt.', 'a real shape.')}</em>
          </h2>
          <p>
            Wyślij konfigurację do wyceny lub{' '}
            <Link prefetch={false} href="/booking/">
              umów konsultację
            </Link>
            .
          </p>
        </div>
        <div className="form-grid">
          <label>
            Imię i nazwisko
            <input name="name" required minLength={2} maxLength={100} />
          </label>
          <label>
            E-mail
            <input name="email" type="email" required maxLength={200} />
          </label>
          <label className="full-grid">
            Dodatkowe informacje
            <textarea name="message" maxLength={2000} rows={3} />
          </label>
          <label className="checkbox full-grid">
            <input type="checkbox" required /> Akceptuję{' '}
            <Link prefetch={false} href="/privacy/">
              zasady prywatności
            </Link>
            . Demo: używaj fikcyjnych danych.
          </label>
          <button disabled={busy} className="button dark" type="submit">
            {busy ? 'Zapisywanie…' : 'Wyślij projekt do wyceny'} ↗
          </button>
        </div>
      </form>
      <p role="status" className="status-message">
        {status}
      </p>
    </section>
  );
}
