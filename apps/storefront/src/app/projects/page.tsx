import Link from 'next/link';
import { asset } from '../../lib/client';
export const metadata = { title: 'Przestrzenie — koncepcje projektowe' };
export default function Projects() {
  return (
    <section className="section page-section">
      <p className="eyebrow">NORDHAUS / PRZESTRZENIE</p>
      <h1>
        Życie między
        <br />
        <em>domem a ogrodem.</em>
      </h1>
      <p className="lead-text">
        Przykładowe koncepcje pokazują możliwości platformy. Nie są zrealizowanymi zamówieniami
        klientów.
      </p>
      <div className="project-grid">
        <article>
          <img
            src={asset('hero.jpg')}
            alt="Koncepcja salonu z naturalną paletą materiałów"
            width="1600"
            height="1200"
          />
          <p className="eyebrow">KONCEPCJA / INTERIOR</p>
          <h2>Spokojny dom</h2>
          <p>Dąb, jasna tkanina i rozproszone światło. Przestrzeń, która daje oddech.</p>
          <Link prefetch={false} href="/shop/" className="inline-link">
            Zobacz kolekcję ↗
          </Link>
        </article>
        <article>
          <img
            src={asset('pergola.svg')}
            alt="Koncepcja zadaszonego tarasu z pergolą"
            width="900"
            height="650"
          />
          <p className="eyebrow">KONCEPCJA / OUTDOOR</p>
          <h2>Ogród na co dzień</h2>
          <p>Grafitowa konstrukcja i ruchome lamele. Cień wtedy, kiedy go potrzebujesz.</p>
          <Link prefetch={false} href="/configure/" className="inline-link">
            Zaprojektuj własną wersję ↗
          </Link>
        </article>
      </div>
    </section>
  );
}
