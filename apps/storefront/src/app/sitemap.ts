export const dynamic = 'force-static';
import type { MetadataRoute } from 'next';
import { products, articles } from '@nordhaus/domain';
export default function sitemap(): MetadataRoute.Sitemap {
  const root = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://nordhaus-studio-andrii-tsap.downyeagle8.chatgpt.site/'
  ).replace(/\/$/, '');
  return [
    '',
    'shop',
    'configure',
    'booking',
    'contact',
    'projects',
    'journal',
    'privacy',
    ...products.map((p) => `shop/${p.id}`),
    ...articles.map((a) => `journal/${a.slug}`),
  ].map((path) => ({
    url: `${root}/${path}${path ? '/' : ''}`,
    changeFrequency: 'monthly',
    priority: path ? 0.7 : 1,
  }));
}
