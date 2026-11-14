import { articles } from '@nordhaus/domain';
import { notFound } from 'next/navigation';
import Link from 'next/link';
export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = articles.find((x) => x.slug === slug);
  return { title: a?.title, description: a?.excerpt };
}
export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = articles.find((x) => x.slug === slug);
  if (!a) notFound();
  return (
    <article className="section article">
      <Link prefetch={false} href="/journal/">
        ← Dziennik
      </Link>
      <p className="eyebrow">{a.category} / NORDHAUS NOTES</p>
      <h1>{a.title}</h1>
      <p className="lead-text">{a.excerpt}</p>
      {a.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <Link prefetch={false} href="/configure/" className="button dark">
        Sprawdź konfigurator 3D ↗
      </Link>
    </article>
  );
}
