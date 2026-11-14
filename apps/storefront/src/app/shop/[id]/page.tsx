import { products } from '@nordhaus/domain';
import { notFound } from 'next/navigation';
import ProductDetail from '../../../components/ProductDetail';
export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = products.find((x) => x.id === id);
  return { title: p?.name, description: p?.description };
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = products.find((x) => x.id === id);
  if (!p) notFound();
  return (
    <>
      <ProductDetail product={p} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: p.name,
            description: p.description,
            brand: { '@type': 'Brand', name: 'Nordhaus — marka koncepcyjna' },
            sku: p.id,
          }),
        }}
      />
    </>
  );
}
