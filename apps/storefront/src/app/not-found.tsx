import Link from 'next/link';
export default function NotFound() {
  return (
    <section className="section empty">
      <p className="eyebrow">404 / NORDHAUS</p>
      <h1>
        Tu jeszcze nic
        <br />
        <em>nie zaprojektowano.</em>
      </h1>
      <Link prefetch={false} href="/" className="button dark">
        Wróć do domu ↗
      </Link>
    </section>
  );
}
