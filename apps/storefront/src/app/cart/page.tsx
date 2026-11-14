'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { products, money, cartTotal } from '@nordhaus/domain';
import { useStore, useT } from '../../lib/store';
import { asset, checkout, apiUrl } from '../../lib/client';
export default function Cart() {
  const { items, remove, quantity, clear } = useStore();
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState(''),
    [error, setError] = useState('');
  const t = useT();
  useEffect(() => setReady(true), []);
  const total = ready ? cartTotal(items) : 0;
  return (
    <section className="section page-section">
      <p className="eyebrow">NORDHAUS / CHECKOUT</p>
      <h1>
        {t('Twój', 'Your')} <em>{t('koszyk.', 'bag.')}</em>
      </h1>
      {result ? (
        <div className="empty">
          <h2>Zamówienie demonstracyjne zapisane</h2>
          <p>{result}</p>
          <p>Nie pobrano płatności. Nie powstaje umowa sprzedaży.</p>
          <Link prefetch={false} href="/shop/" className="button dark">
            Wróć do kolekcji
          </Link>
        </div>
      ) : !ready ? (
        <p>Ładowanie…</p>
      ) : !items.length ? (
        <div className="empty">
          <p>
            {t(
              'Koszyk jest pusty. Znajdź coś dla siebie.',
              'Your bag is empty. Find something you love.',
            )}
          </p>
          <Link prefetch={false} className="button dark" href="/shop/">
            {t('Zobacz kolekcję', 'Explore collection')}
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {items.map((item, i) => {
              const p = products.find((x) => x.id === item.productId)!;
              return (
                <article className="cart-item" key={`${item.productId}-${item.color}-${item.size}`}>
                  <img src={asset(`${p.image}.jpg`)} alt={p.name} width="120" height="120" />
                  <div>
                    <Link prefetch={false} href={`/shop/${p.id}/`}>
                      <h3>{p.name}</h3>
                    </Link>
                    <p className="muted tiny">
                      {item.color} / {item.size}
                    </p>
                    <label>
                      Ilość
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={item.quantity}
                        onChange={(e) => quantity(i, +e.target.value || 1)}
                      />
                    </label>
                    <button className="text-button" onClick={() => remove(i)}>
                      {t('Usuń', 'Remove')}
                    </button>
                  </div>
                  <strong>{money(p.price * item.quantity)}</strong>
                </article>
              );
            })}
          </div>
          <form
            className="summary-card"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError('');
              try {
                const f = new FormData(e.currentTarget);
                const res = await checkout(items, String(f.get('email')));
                if (res.url) location.assign(res.url);
                else {
                  setResult('Numer: ' + ('id' in res ? res.id : ''));
                  clear();
                }
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <h2>{t('Podsumowanie', 'Summary')}</h2>
            <div className="total-row">
              <span>Produkty (brutto)</span>
              <strong>{money(total)}</strong>
            </div>
            <p className="tiny muted">VAT zawarty w cenie. Demo nie obejmuje dostawy.</p>
            <label>
              E-mail
              <input name="email" type="email" required maxLength={200} />
            </label>
            <label className="checkbox">
              <input type="checkbox" required /> Akceptuję{' '}
              <Link prefetch={false} href="/privacy/">
                regulamin demo
              </Link>
              .
            </label>
            <button className="button dark full" disabled={busy}>
              {busy
                ? 'Zapisywanie…'
                : apiUrl
                  ? 'Stripe — płatność testowa'
                  : 'Zapisz zamówienie DEMO'}
            </button>
            <p className="tiny">
              {apiUrl ? 'Wyłącznie testowy Stripe.' : 'Bez danych karty i bez obciążenia.'}
            </p>
            <p role="alert" className="error">
              {error}
            </p>
          </form>
        </div>
      )}
    </section>
  );
}
