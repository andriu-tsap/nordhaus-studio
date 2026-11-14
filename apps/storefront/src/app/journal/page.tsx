import Link from 'next/link';
import { articles } from '@nordhaus/domain';
export const metadata = { title: 'Dziennik — inspiracje i poradniki' };
export default function Journal() {
  return (
    <section className="section page-section">
      <p className="eyebrow">NORDHAUS / DZIENNIK</p>
      <h1>
        Przestrzeń
        <br />
        <em>na nowe myśli.</em>
      </h1>
      <div className="journal-grid">
        {articles.map((a, i) => (
          <Link prefetch={false} href={`/journal/${a.slug}/`} className="journal-card" key={a.slug}>
            <div className={`journal-cover cover-${i}`}>
              <span>0{i + 1}</span>
              <span>↗</span>
            </div>
            <p className="eyebrow">{a.category}</p>
            <h2>{a.title}</h2>
            <p>{a.excerpt}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
