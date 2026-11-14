'use client';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Box, SlidersHorizontal, CalendarDays } from 'lucide-react';
import { products, articles } from '@nordhaus/domain';
import { useT } from '../lib/store';
import { asset } from '../lib/client';
import ProductCard from '../components/ProductCard';
export default function Home() {
  const t = useT();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="dot" />
            {t('WNĘTRZE. TARAS. TWOJA PRZESTRZEŃ.', 'INTERIOR. TERRACE. YOUR SPACE.')}
          </div>
          <h1>
            {t('Bliżej natury.', 'Closer to nature.')}
            <br />
            <em>{t('Bliżej siebie.', 'Closer to you.')}</em>
          </h1>
          <p>
            {t(
              'Przemyślane meble i architektura tarasu. Połącz wnętrze z tym, co na zewnątrz — po swojemu.',
              'Considered furniture and terrace architecture. Connect your interior with the outdoors — your way.',
            )}
          </p>
          <div className="button-row">
            <Link prefetch={false} className="button dark" href="/configure/">
              {t('Zaprojektuj pergolę', 'Design your pergola')} <ArrowUpRight size={18} />
            </Link>
            <Link prefetch={false} className="inline-link" href="/shop/">
              {t('Odkryj kolekcję', 'Explore the collection')} <ArrowRight size={18} />
            </Link>
          </div>
          <div className="hero-note">
            <span>01 / 03</span>
            <span>{t('Harmonia zaczyna się w domu.', 'Harmony begins at home.')}</span>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src={asset('hero.jpg')}
            srcSet={`${asset('hero-small.webp')} 800w, ${asset('hero.webp')} 1600w`}
            sizes="(max-width: 800px) 100vw, 50vw"
            alt="Jasny salon z naturalnymi materiałami i otwartą przestrzenią"
            width="1600"
            height="1200"
            fetchPriority="high"
          />
          <div className="visual-label">
            THE NORDHAUS WAY <span>↗</span>
          </div>
          <Link prefetch={false} className="floating-card" href="/configure/">
            <span className="floating-icon">
              <Box />
            </span>
            <div>
              <strong>{t('Twój taras, Twój projekt', 'Your terrace, your design')}</strong>
              <span>{t('Konfigurator 3D · wycena na żywo', '3D configurator · live pricing')}</span>
            </div>
            <ArrowUpRight size={21} />
          </Link>
        </div>
      </section>
      <div className="principles">
        <span>{t('Naturalne materiały', 'Natural materials')}</span>
        <span>{t('Przemyślane proporcje', 'Considered proportions')}</span>
        <span>{t('Projekt na Twoich zasadach', 'Design on your terms')}</span>
        <span>{t('Od pomysłu do przestrzeni', 'From idea to space')}</span>
      </div>
      <section className="section collection">
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 — {t('KOLEKCJA', 'COLLECTION')}</p>
            <h2>
              {t('Mniej rzeczy.', 'Fewer things.')}{' '}
              <em>{t('Więcej znaczenia.', 'More meaning.')}</em>
            </h2>
          </div>
          <Link prefetch={false} className="inline-link" href="/shop/">
            {t('Zobacz kolekcję', 'View the collection')} <ArrowRight size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {products.slice(0, 3).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <section className="config-promo">
        <div className="config-art">
          <img
            src={asset('pergola.svg')}
            alt="Koncepcja grafitowej pergoli z ruchomymi lamelami"
            width="900"
            height="650"
            loading="lazy"
          />
          <span className="art-label">NORD / 01 · RAL 7016</span>
        </div>
        <div className="config-copy">
          <p className="eyebrow">02 — OUTDOOR LIVING</p>
          <h2>
            {t('Jeszcze jeden', 'One more')}
            <br />
            <em>{t('pokój. Na zewnątrz.', 'room. Outside.')}</em>
          </h2>
          <p>
            {t(
              'Słońce czy cień? Poranna kawa czy długi wieczór? Stwórz pergolę, która dopasuje się do Twojego rytmu.',
              'Sun or shade? Morning coffee or a long evening? Create a pergola that adapts to your rhythm.',
            )}
          </p>
          <ul className="feature-list">
            <li>
              <SlidersHorizontal size={20} />
              {t(
                'Wymiary, kolory i detale pod Twoją kontrolą',
                'Dimensions, colours and details in your control',
              )}
            </li>
            <li>
              <Box size={20} />
              {t(
                'Obracaj model i zobacz każdą perspektywę',
                'Rotate the model and explore every angle',
              )}
            </li>
            <li>
              <CalendarDays size={20} />
              {t('Zapisz projekt i umów konsultację', 'Save your design and book a consultation')}
            </li>
          </ul>
          <Link prefetch={false} href="/configure/" className="button dark">
            {t('Otwórz konfigurator 3D', 'Open 3D configurator')} <ArrowUpRight size={18} />
          </Link>
          <p className="tiny muted">
            {t(
              'Ceny orientacyjne. Projekt koncepcyjny, bez sprzedaży.',
              'Indicative prices. Concept project, no sales.',
            )}
          </p>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">03 — {t('DZIENNIK', 'JOURNAL')}</p>
            <h2>
              {t('Dobrze być', 'Good to be')} <em>{t('u siebie.', 'at home.')}</em>
            </h2>
          </div>
          <Link prefetch={false} href="/journal/" className="inline-link">
            {t('Wszystkie historie', 'All stories')} <ArrowRight size={18} />
          </Link>
        </div>
        <div className="journal-grid">
          {articles.map((a, i) => (
            <Link
              prefetch={false}
              className="journal-card"
              key={a.slug}
              href={`/journal/${a.slug}/`}
            >
              <div className={`journal-cover cover-${i}`}>
                <span>0{i + 1}</span>
                <ArrowUpRight />
              </div>
              <p className="eyebrow">{a.category}</p>
              <h3>{a.title}</h3>
              <p>{a.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
