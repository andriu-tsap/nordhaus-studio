'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingBag, ArrowUpRight, Menu, X, MessageCircle } from 'lucide-react';
import { useStore, useT } from '../lib/store';
import { base, apiUrl, saveLead } from '../lib/client';
export default function Shell({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false),
    [menu, setMenu] = useState(false),
    [chat, setChat] = useState(false),
    [consent, setConsent] = useState(false),
    [message, setMessage] = useState('');
  const { items, locale, setLocale } = useStore();
  const t = useT();
  useEffect(() => {
    setReady(true);
    setConsent(localStorage.getItem('nh-consent') === 'yes');
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <>
      <a href="#main" className="skip">
        {t('Przejdź do treści', 'Skip to content')}
      </a>
      <div className="announcement">
        {t(
          'Projekt koncepcyjny Andrii Tsap · fikcyjna marka ·',
          'Concept project by Andrii Tsap · fictional brand ·',
        )}{' '}
        <strong>{apiUrl ? 'API CONNECTED' : 'DEMO'}</strong>
      </div>
      <header className="header">
        <Link
          prefetch={false}
          href="/"
          className="logo"
          aria-label="nordhaus STUDIO — strona główna"
        >
          nordhaus<span>STUDIO</span>
        </Link>
        <nav className={menu ? 'nav open' : 'nav'} aria-label="Menu główne">
          <Link prefetch={false} href="/shop/" onClick={() => setMenu(false)}>
            {t('Kolekcja', 'Collection')}
          </Link>
          <Link prefetch={false} href="/configure/" onClick={() => setMenu(false)}>
            {t('Konfigurator 3D', '3D configurator')} <span className="dot" />
          </Link>
          <Link prefetch={false} href="/projects/" onClick={() => setMenu(false)}>
            {t('Przestrzenie', 'Spaces')}
          </Link>
          <Link prefetch={false} href="/journal/" onClick={() => setMenu(false)}>
            {t('Dziennik', 'Journal')}
          </Link>
        </nav>
        <div className="header-actions">
          <button
            className="text-button"
            onClick={() => setLocale(locale === 'pl' ? 'en' : 'pl')}
            aria-label={locale.toUpperCase() + ' — Zmień język'}
          >
            {locale.toUpperCase()}
          </button>
          <Link
            prefetch={false}
            href="/cart/"
            className="bag"
            aria-label={
              t('Koszyk', 'Cart') + ' ' + (ready ? items.reduce((s, i) => s + i.quantity, 0) : 0)
            }
          >
            <ShoppingBag size={20} />
            <span>{ready ? items.reduce((s, i) => s + i.quantity, 0) : 0}</span>
          </Link>
          <Link prefetch={false} className="button small dark consultation" href="/booking/">
            {t('Porozmawiajmy', 'Let’s talk')} <ArrowUpRight size={16} />
          </Link>
          <button
            className="mobile-menu"
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
            aria-label="Otwórz menu"
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer>
        <div className="footer-top">
          <div>
            <p className="eyebrow">NORDHAUS STUDIO</p>
            <h2>
              {t('Dobry projekt zaczyna się', 'Good design starts')}
              <br />
              {t('od rozmowy.', 'with a conversation.')}
            </h2>
            <Link prefetch={false} href="/booking/" className="button light">
              {t('Umów konsultację', 'Book a consultation')} <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="footer-links">
            <Link prefetch={false} href="/shop/">
              {t('Sklep', 'Shop')}
            </Link>
            <Link prefetch={false} href="/configure/">
              {t('Konfigurator', 'Configurator')}
            </Link>
            <Link prefetch={false} href="/contact/">
              {t('Kontakt', 'Contact')}
            </Link>
            <Link prefetch={false} href="/privacy/">
              {t('Prywatność i regulamin demo', 'Privacy & demo terms')}
            </Link>
            <a href={`${base}/studio/`}>Studio CRM ↗</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Nordhaus Studio — {t('fikcyjna marka', 'fictional brand')}</span>
          <a href="https://github.com/andriu-tsap" rel="noreferrer" target="_blank">
            Design & code: Andrii Tsap ↗
          </a>
        </div>
      </footer>
      <button
        className="chat-toggle"
        onClick={() => setChat(!chat)}
        aria-label="FAQ i kontakt"
        aria-expanded={chat}
      >
        {chat ? <X /> : <MessageCircle />}
      </button>
      {chat && (
        <aside className="chat-panel" aria-label="Asystent FAQ">
          <h3>Nordhaus · FAQ</h3>
          <p>Jak działa demo?</p>
          <p>
            Możesz projektować, rezerwować i zapisywać przykładowe zapytania. Nie pobieramy
            płatności.
          </p>
          <details>
            <summary>Co obejmuje cena pergoli?</summary>
            <p>
              Konstrukcję, dach, wybrane dodatki i VAT 23%. Bez montażu, fundamentów i transportu.
            </p>
          </details>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                await saveLead({
                  name: 'Zapytanie FAQ',
                  email: String(f.get('email')),
                  message: 'Prośba o kontakt z widgetu FAQ',
                });
                setMessage('Zapisano zapytanie. W demo e-mail nie jest wysyłany.');
              } catch {
                setMessage('Nie udało się zapisać zapytania. Spróbuj ponownie.');
              }
            }}
          >
            <label htmlFor="chat-email">E-mail do kontaktu</label>
            <input id="chat-email" name="email" type="email" required maxLength={200} />
            <label className="checkbox">
              <input type="checkbox" required /> Akceptuję{' '}
              <Link prefetch={false} href="/privacy/">
                zasady prywatności
              </Link>
              .
            </label>
            <button className="button dark" type="submit">
              Poproś o kontakt
            </button>
          </form>
          <p role="status">{message}</p>
        </aside>
      )}
      {ready && !consent && (
        <div className="consent" role="region" aria-label="Pamięć lokalna">
          <span>
            Demo zapisuje koszyk i przykładowe dane w Twojej przeglądarce. Bez analityki i reklam.
          </span>
          <button
            onClick={() => {
              localStorage.setItem('nh-consent', 'yes');
              setConsent(true);
            }}
          >
            Rozumiem
          </button>
        </div>
      )}
    </>
  );
}
