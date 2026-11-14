import Link from 'next/link';
import type { Product } from '@nordhaus/domain';
import { money } from '@nordhaus/domain';
import { ArrowUpRight } from 'lucide-react';
import { asset } from '../lib/client';
export default function ProductCard({ product: p }: { product: Product }) {
  return (
    <Link prefetch={false} href={`/shop/${p.id}/`} className="product-card">
      <div className="product-image">
        <img src={asset(`${p.image}.jpg`)} alt={p.name} width="800" height="800" loading="lazy" />
        <span className="product-arrow">
          <ArrowUpRight size={20} />
        </span>
      </div>
      <div className="product-meta">
        <div>
          <span className="muted tiny">{p.category}</span>
          <h3>{p.name}</h3>
        </div>
        <span>{money(p.price)}</span>
      </div>
    </Link>
  );
}
