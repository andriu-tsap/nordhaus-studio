'use client';
import { track } from '../lib/analytics';
import { useState } from 'react';
import Link from 'next/link';
import type { Product } from '@nordhaus/domain';
import { money } from '@nordhaus/domain';
import { useStore, useT } from '../lib/store';
import { asset } from '../lib/client';
export default function ProductDetail({ product: p }: { product: Product }) {
  const [color, setColor] = useState(p.colors[0]),
    [size, setSize] = useState(p.sizes[0]),
    [added, setAdded] = useState(false),
    [view, setView] = useState(0);
  const add = useStore((s) => s.add),
    t = useT();
  return (
    <section className="section detail">
      <div>
        <div className={`detail-image view-${view}`}>
          <img
            src={asset(`${p.image}.jpg`)}
            alt={`${p.name} — ${view ? 'zbliżenie detalu' : 'widok ogólny'}`}
            width="800"
            height="800"
          />
        </div>
        <div className="button-row">
          <button className="chip" aria-pressed={view === 0} onClick={() => setView(0)}>
            Widok ogólny
          </button>
          <button className="chip" aria-pressed={view === 1} onClick={() => setView(1)}>
            Zbliżenie
          </button>
        </div>
      </div>
      <div className="detail-copy">
        <Link prefetch={false} className="muted tiny" href="/shop/">
          ← {t('Wróć do kolekcji', 'Back to collection')}
        </Link>
        <p className="eyebrow">{p.category}</p>
        <h1>{p.name}</h1>
        <p className="price">{money(p.price)}</p>
        <p>{p.description}</p>
        <label>
          {t('Kolor', 'Colour')}
          <select
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              setAdded(false);
            }}
          >
            {p.colors.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          {t('Rozmiar', 'Size')}
          <select
            value={size}
            onChange={(e) => {
              setSize(e.target.value);
              setAdded(false);
            }}
          >
            {p.sizes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button
          className="button dark full"
          onClick={() => {
            add({ productId: p.id, quantity: 1, color, size });
            setAdded(true);
            track('add_to_cart', {
              ecommerce: {
                currency: 'PLN',
                items: [{ item_id: p.id, price: p.price / 100, quantity: 1 }],
              },
            });
          }}
        >
          {t('Dodaj do koszyka', 'Add to cart')} ↗
        </button>
        <div role="status">
          {added && (
            <p className="success">
              {t('Dodano do koszyka.', 'Added to cart.')}{' '}
              <Link prefetch={false} href="/cart/">
                {t('Przejdź do koszyka →', 'View cart →')}
              </Link>
            </p>
          )}
        </div>
        <details>
          <summary>Materiały i pielęgnacja</summary>
          <p>
            Używaj miękkiej, lekko wilgotnej ściereczki. Unikaj długiej ekspozycji na wilgoć i
            agresywnych detergentów.
          </p>
        </details>
        <details>
          <summary>Dostawa i zwroty — zasady demo</summary>
          <p>
            Nie realizujemy dostaw ani płatności. Wszystkie produkty są koncepcyjne, a ceny
            przykładowe, brutto z VAT.
          </p>
        </details>
      </div>
    </section>
  );
}
