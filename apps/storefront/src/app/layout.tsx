import type { Metadata } from 'next';
import Shell from '../components/Shell';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      'https://nordhaus-studio-andrii-tsap.downyeagle8.chatgpt.site/',
  ),
  title: { default: 'Nordhaus Studio — przestrzeń do życia', template: '%s | Nordhaus Studio' },
  description:
    'Koncepcyjna platforma wnętrz i tarasów: kolekcja mebli, konfigurator pergoli 3D i konsultacje. Portfolio Andrii Tsap.',
  openGraph: {
    title: 'Nordhaus Studio',
    description: 'Zaprojektuj swoją przestrzeń. Projekt koncepcyjny Andrii Tsap.',
    type: 'website',
  },
  robots: { index: true, follow: true },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <Shell>{children}</Shell>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Nordhaus Studio — fikcyjna marka',
              description: 'Projekt koncepcyjny do portfolio Andrii Tsap',
            }),
          }}
        />
      </body>
    </html>
  );
}
