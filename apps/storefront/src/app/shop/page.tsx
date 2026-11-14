'use client';
import { useMemo, useState } from 'react';
import { products, money } from '@nordhaus/domain';
import ProductCard from '../../components/ProductCard';
import { useT } from '../../lib/store';
export default function Shop() {
  const [q, setQ] = useState(''),
    [cat, setCat] = useState('Wszystkie'),
    [sort, setSort] = useState('name'),
    [max, setMax] = useState(700000);
  const t = useT();
  const visible = useMemo(
    () =>
      products
        .filter(
          (p) =>
            (cat === 'Wszystkie' || p.category === cat) &&
            p.name.toLowerCase().includes(q.toLowerCase()) &&
            p.price <= max,
        )
        .sort((a, b) =>
          sort === 'asc'
            ? a.price - b.price
            : sort === 'desc'
              ? b.price - a.price
              : a.name.localeCompare(b.name),
        ),
    [q, cat, sort, max],
  );
  return (
    <section className="section page-section">
      <p className="eyebrow">THE NORDHAUS COLLECTION</p>
      <h1>
        {t('Rzeczy, z którymi', 'Things you')}
        <br />
        <em>{t('chcesz zostać.', 'want to keep.')}</em>
      </h1>
      <div className="shop-toolbar">
        <label>
          {t('Szukaj', 'Search')}
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('Nazwa produktu…', 'Product name…')}
          />
        </label>
        <label>
          {t('Kategoria', 'Category')}
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            {['Wszystkie', 'Meble', 'Oświetlenie', 'Dodatki'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          {t('Cena do', 'Maximum price')}: {money(max)}
          <input
            type="range"
            min="30000"
            max="700000"
            step="10000"
            value={max}
            onChange={(e) => setMax(+e.target.value)}
          />
        </label>
        <label>
          {t('Sortowanie', 'Sort by')}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">Nazwa A–Z</option>
            <option value="asc">Cena rosnąco</option>
            <option value="desc">Cena malejąco</option>
          </select>
        </label>
      </div>
      <p className="muted" role="status">
        {visible.length}{' '}
        {t('produktów · kolekcja demonstracyjna', 'products · demonstration collection')}
      </p>
      <div className="product-grid">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {!visible.length && (
        <div className="empty">
          <h2>{t('Brak produktów', 'No products found')}</h2>
          <button
            className="button dark"
            onClick={() => {
              setQ('');
              setCat('Wszystkie');
              setMax(700000);
            }}
          >
            Wyczyść filtry
          </button>
        </div>
      )}
    </section>
  );
}
