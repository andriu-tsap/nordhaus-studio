export const dynamic = 'force-static';
import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/studio/', '/cart/'] },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nordhaus-studio-andrii-tsap.downyeagle8.chatgpt.site/'}sitemap.xml`,
  };
}
