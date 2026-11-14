'use client';
import { useState } from 'react';
import Link from 'next/link';
import { saveLead, apiUrl } from '../../lib/client';
export default function Contact() {
  const [status, setStatus] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <section className="section page-section">
      <p className="eyebrow">NORDHAUS / KONTAKT</p>
      <h1>
        Masz pomysł?
        <br />
        <em>Zamieńmy go w projekt.</em>
      </h1>
      <div className="booking-layout">
        <div>
          <p>
            To demonstracyjny formularz platformy Nordhaus Studio. Zapytania pojawiają się w panelu
            CRM.
          </p>
          <p>Kontakt z autorem projektu:</p>
          <a className="inline-link" href="https://github.com/andriu-tsap">
            github.com/andriu-tsap ↗
          </a>
          <p className="muted tiny">Marka, produkty i zespół są fikcyjne.</p>
        </div>
        <form
          className="booking-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const f = new FormData(e.currentTarget);
            try {
              const l = await saveLead({
                name: String(f.get('name')),
                email: String(f.get('email')),
                message: String(f.get('message')),
              });
              setStatus(
                `Zapisano ${l.id}. ${apiUrl ? 'Zapytanie trafiło do CRM.' : 'Tryb DEMO: dane zapisano w tej przeglądarce.'}`,
              );
            } catch (err) {
              setStatus((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Imię i nazwisko
            <input name="name" required minLength={2} maxLength={100} />
          </label>
          <label>
            E-mail
            <input name="email" type="email" required maxLength={200} />
          </label>
          <label>
            Opowiedz o projekcie
            <textarea name="message" required minLength={5} maxLength={2000} rows={5} />
          </label>
          <label className="checkbox">
            <input type="checkbox" required /> Akceptuję{' '}
            <Link prefetch={false} href="/privacy/">
              zasady prywatności
            </Link>
            .
          </label>
          <button className="button dark" disabled={busy}>
            {busy ? 'Zapisywanie…' : 'Wyślij zapytanie'} ↗
          </button>
          <p role="status">{status}</p>
        </form>
      </div>
    </section>
  );
}
