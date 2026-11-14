'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { employees } from '@nordhaus/domain';
import { book, getSlots, apiUrl } from '../../lib/client';
import { useT } from '../../lib/store';
export default function Booking() {
  const [day, setDay] = useState(''),
    [employee, setEmployee] = useState(employees[0]),
    [slots, setSlots] = useState<string[]>([]),
    [selected, setSelected] = useState(''),
    [status, setStatus] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [done, setDone] = useState(false);
  const t = useT();
  useEffect(() => {
    let active = true;
    setSelected('');
    if (day) {
      setLoading(true);
      getSlots(day, employee)
        .then((s) => {
          if (active) setSlots(s);
        })
        .catch(() => {
          if (active) {
            setSlots([]);
            setStatus('Nie udało się pobrać terminów.');
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [day, employee]);
  return (
    <section className="section page-section">
      <p className="eyebrow">NORDHAUS / CONSULTATION</p>
      <h1>
        {t('Zacznijmy', 'Let’s start')}
        <br />
        <em>{t('od Twoich potrzeb.', 'with your needs.')}</em>
      </h1>
      <div className="booking-layout">
        <div className="booking-info">
          <span className="tag">60 MIN / ONLINE</span>
          <h2>{t('Konsultacja projektowa', 'Design consultation')}</h2>
          <p>
            Porozmawiamy o Twojej przestrzeni, materiale i budżecie. Wspólnie wybierzemy kierunek
            projektu.
          </p>
          <hr />
          <p className="tiny muted">
            Terminy w strefie Europe/Warsaw. Pon.–pt. 9:00–17:00, przerwa 12:00–13:00. Jedna
            konsultacja trwa godzinę.
          </p>
          <p className="tiny">
            {apiUrl
              ? 'Zapis przez API.'
              : 'DEMO: rezerwacja lokalna. Nie organizujemy prawdziwych spotkań.'}
          </p>
        </div>
        <form
          className="booking-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!selected) return;
            setBusy(true);
            const f = new FormData(e.currentTarget);
            try {
              await book({
                employee,
                start: selected,
                name: String(f.get('name')),
                email: String(f.get('email')),
              });
              setStatus(
                'Rezerwacja zapisana. ' +
                  (apiUrl
                    ? 'Sprawdź potwierdzenie.'
                    : 'DEMO: bez wysyłki e-mail i rzeczywistego spotkania.'),
              );
              setDone(true);
              setSlots(await getSlots(day, employee));
              setSelected('');
            } catch (err) {
              setStatus((err as Error).message);
              setSlots(await getSlots(day, employee));
              setSelected('');
            } finally {
              setBusy(false);
            }
          }}
        >
          {done ? (
            <div className="success">
              <h2>Zarezerwowano termin</h2>
              <p>{status}</p>
              <button
                type="button"
                className="button dark"
                onClick={() => {
                  setDone(false);
                  setStatus('');
                }}
              >
                Wybierz kolejny termin
              </button>
            </div>
          ) : (
            <>
              <div className="form-grid">
                <label>
                  Twój doradca
                  <select value={employee} onChange={(e) => setEmployee(e.target.value)}>
                    {employees.map((e) => (
                      <option key={e}>{e}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Data
                  <input
                    type="date"
                    required
                    value={day}
                    min={new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' })}
                    onChange={(e) => setDay(e.target.value)}
                  />
                </label>
              </div>
              <p className="eyebrow">DOSTĘPNE GODZINY</p>
              <div className="slots" role="group" aria-label="Dostępne terminy">
                {slots.map((start) => (
                  <button
                    className="chip"
                    type="button"
                    key={start}
                    aria-pressed={selected === start}
                    onClick={() => setSelected(start)}
                  >
                    {new Date(start).toLocaleTimeString('pl-PL', {
                      timeZone: 'Europe/Warsaw',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </button>
                ))}
              </div>
              {loading ? (
                <p role="status">Pobieranie terminów…</p>
              ) : (
                !slots.length && (
                  <p className="muted">
                    {day
                      ? 'Brak dostępnych godzin. Wybierz inny dzień roboczy.'
                      : 'Wybierz datę, aby zobaczyć terminy.'}
                  </p>
                )
              )}
              <div className="form-grid">
                <label>
                  Imię i nazwisko
                  <input name="name" required minLength={2} maxLength={100} />
                </label>
                <label>
                  E-mail
                  <input type="email" name="email" required maxLength={200} />
                </label>
              </div>
              <label className="checkbox">
                <input type="checkbox" required /> Akceptuję{' '}
                <Link prefetch={false} href="/privacy/">
                  zasady prywatności
                </Link>
                .
              </label>
              <button className="button dark" disabled={!selected || busy || loading}>
                {busy ? 'Zapisywanie…' : 'Zarezerwuj konsultację'} ↗
              </button>
              <p role="status">{status}</p>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
