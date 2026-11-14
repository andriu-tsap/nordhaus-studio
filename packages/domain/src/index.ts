import { cmsProducts, cmsArticles } from './cms.js';
export type Roof = 'louvres' | 'glass' | 'polycarbonate';
export interface Configuration {
  width: number;
  depth: number;
  height: number;
  roof: Roof;
  ral: string;
  led: boolean;
  blinds: boolean;
}
export interface PriceBook {
  base: number;
  perM2: Record<Roof, number>;
  led: number;
  blinds: number;
  vat: number;
}
export const priceBook: PriceBook = {
  base: 420000,
  perM2: { louvres: 89000, glass: 72000, polycarbonate: 49000 },
  led: 180000,
  blinds: 340000,
  vat: 23,
};
export const defaultConfiguration: Configuration = {
  width: 4,
  depth: 3,
  height: 2.6,
  roof: 'louvres',
  ral: '#343b3c',
  led: false,
  blinds: false,
};
export function validateConfiguration(c: Configuration): void {
  if (
    !c ||
    !Number.isFinite(c.width) ||
    c.width < 3 ||
    c.width > 7 ||
    !Number.isFinite(c.depth) ||
    c.depth < 2 ||
    c.depth > 5 ||
    !Number.isFinite(c.height) ||
    c.height < 2.3 ||
    c.height > 3.2 ||
    !['louvres', 'glass', 'polycarbonate'].includes(c.roof) ||
    !['#343b3c', '#ede8de', '#867761'].includes(c.ral) ||
    typeof c.led !== 'boolean' ||
    typeof c.blinds !== 'boolean'
  )
    throw new Error('Nieprawidłowa konfiguracja');
}
export function calculatePrice(c: Configuration, book = priceBook) {
  validateConfiguration(c);
  const net =
    book.base +
    Math.round(c.width * c.depth * book.perM2[c.roof]) +
    (c.led ? book.led : 0) +
    (c.blinds ? book.blinds : 0);
  const vat = Math.round((net * book.vat) / 100);
  return { net, vat, gross: net + vat, area: Math.round(c.width * c.depth * 100) / 100 };
}
export const money = (cents: number, locale = 'pl-PL') =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(cents / 100);
export interface Product {
  id: string;
  name: string;
  category: 'Meble' | 'Oświetlenie' | 'Dodatki';
  price: number;
  image: string;
  description: string;
  colors: string[];
  sizes: string[];
}
const baseProducts: Product[] = [
  {
    id: 'fotel-ora',
    name: 'Fotel Ora',
    category: 'Meble',
    price: 249000,
    image: 'chair',
    description:
      'Miękka forma, naturalny dąb i tkanina o wyraźnym splocie. Mebel do codziennego odpoczynku. Wymiary 82 × 78 × 74 cm.',
    colors: ['Piaskowy', 'Grafitowy'],
    sizes: ['Standard'],
  },
  {
    id: 'stol-form',
    name: 'Stół Form',
    category: 'Meble',
    price: 389000,
    image: 'table',
    description:
      'Stół z litego dębu o spokojnej, architektonicznej sylwetce. Wykończenie olejowane.',
    colors: ['Dąb naturalny', 'Dąb ciemny'],
    sizes: ['160 cm', '200 cm'],
  },
  {
    id: 'lampa-line',
    name: 'Lampa Line',
    category: 'Oświetlenie',
    price: 89000,
    image: 'lamp',
    description:
      'Rozproszone, ciepłe światło do wnętrz i zadaszonych tarasów. Źródło światła LED 2700 K.',
    colors: ['Czarny', 'Kremowy'],
    sizes: ['S', 'M'],
  },
  {
    id: 'sofa-havn',
    name: 'Sofa Havn',
    category: 'Meble',
    price: 649000,
    image: 'sofa',
    description:
      'Modułowa sofa z wymiennymi pokrowcami i głębokim siedziskiem. Stworzona do długich wieczorów.',
    colors: ['Piaskowy', 'Grafitowy'],
    sizes: ['2 miejsca', '3 miejsca'],
  },
  {
    id: 'wazon-arc',
    name: 'Wazon Arc',
    category: 'Dodatki',
    price: 29000,
    image: 'vase',
    description:
      'Ceramiczny wazon o matowej powierzchni. Każdy detal kolekcji jest przykładowym produktem marki koncepcyjnej.',
    colors: ['Kremowy', 'Terakota'],
    sizes: ['S', 'L'],
  },
  {
    id: 'stolik-noma',
    name: 'Stolik Noma',
    category: 'Meble',
    price: 129000,
    image: 'table',
    description: 'Kompaktowy stolik z dębowym blatem, który łączy salon z tarasem.',
    colors: ['Dąb naturalny'],
    sizes: ['60 cm', '80 cm'],
  },
];
export const products: Product[] = cmsProducts.length ? cmsProducts : baseProducts;
export interface CartItem {
  productId: string;
  quantity: number;
  color: string;
  size: string;
}
export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (
      !product ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20 ||
      !product.colors.includes(item.color) ||
      !product.sizes.includes(item.size)
    )
      throw new Error('Nieprawidłowa pozycja koszyka');
    return sum + product.price * item.quantity;
  }, 0);
}
export const stages = ['Nowy', 'Kontakt', 'Oferta', 'Umowa'] as const;
export type Stage = (typeof stages)[number];
export interface Lead {
  id: string;
  name: string;
  email: string;
  stage: Stage;
  value: number;
  source: string;
  createdAt: string;
}
export const demoLeads: Lead[] = [
  {
    id: 'L-1001',
    name: 'Anna Przykładowa',
    email: 'anna@example.com',
    stage: 'Nowy',
    value: 1839000,
    source: 'Konfigurator 3D',
    createdAt: '2026-11-10',
  },
  {
    id: 'L-1002',
    name: 'Marek Testowy',
    email: 'marek@example.com',
    stage: 'Kontakt',
    value: 2490000,
    source: 'Konsultacja',
    createdAt: '2026-11-11',
  },
  {
    id: 'L-1003',
    name: 'Studio Przykład',
    email: 'studio@example.com',
    stage: 'Oferta',
    value: 3240000,
    source: 'Formularz',
    createdAt: '2026-11-12',
  },
  {
    id: 'L-1004',
    name: 'Ola Demonstracyjna',
    email: 'ola@example.com',
    stage: 'Umowa',
    value: 1960000,
    source: 'Konfigurator 3D',
    createdAt: '2026-11-13',
  },
];
export interface Booking {
  id: string;
  employee: string;
  start: string;
  name: string;
  email: string;
}
export const employees = ['Julia — projektantka', 'Adam — doradca'];
/** Fixed one-hour slots make uniqueness enforceable by the database, even under concurrency. */
export function availableSlots(
  day: string,
  employee: string,
  bookings: Booking[],
  now = new Date(),
): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !employees.includes(employee)) return [];
  const noon = new Date(`${day}T12:00:00Z`);
  if (
    Number.isNaN(noon.getTime()) ||
    noon.toISOString().slice(0, 10) !== day ||
    [0, 6].includes(noon.getUTCDay())
  )
    return [];
  // The offset is selected for the appointment date, not the visitor's timezone.
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Warsaw',
    timeZoneName: 'shortOffset',
  }).formatToParts(noon);
  const summer = parts.some((p) => p.type === 'timeZoneName' && p.value === 'GMT+2');
  return [9, 10, 11, 13, 14, 15, 16]
    .map((h) =>
      new Date(
        `${day}T${String(h).padStart(2, '0')}:00:00${summer ? '+02:00' : '+01:00'}`,
      ).toISOString(),
    )
    .filter(
      (start) =>
        new Date(start) > now &&
        !bookings.some((b) => b.employee === employee && b.start === start),
    );
}
export function csvCell(value: unknown): string {
  const s = String(value ?? '');
  return '"' + (/^[=+@\-\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""') + '"';
}
export function leadsCsv(leads: Lead[]): string {
  return (
    '\uFEFF' +
    [
      ['ID', 'Nazwa', 'Email', 'Etap', 'Wartość PLN'],
      ...leads.map((l) => [l.id, l.name, l.email, l.stage, (l.value / 100).toFixed(2)]),
    ]
      .map((row) => row.map(csvCell).join(';'))
      .join('\r\n')
  );
}
export interface Article {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  paragraphs: string[];
}
const baseArticles: Article[] = [
  {
    slug: 'taras-przez-caly-rok',
    title: 'Taras, który przedłuża dom',
    category: 'Inspiracje',
    excerpt: 'Światło, materiały i proporcje. Trzy rzeczy, od których warto zacząć.',
    paragraphs: [
      'Dobry taras zaczyna się od sposobu, w jaki chcesz z niego korzystać. Miejsce do pracy potrzebuje innego światła niż przestrzeń do spotkań przy stole. Zanim wybierzesz zadaszenie, zapisz swoje codzienne rytuały.',
      'Zachowaj spójność materiałów. Dąb we wnętrzu może znaleźć odpowiednik w drewnianym podeście, a grafitowe ramy okienne w konstrukcji pergoli. Dwa lub trzy materiały wystarczą, aby stworzyć harmonijną całość.',
      'Uwzględnij odpływ wody, lokalne obciążenia śniegiem i kierunek wiatru. Konfigurator pokazuje koncepcję i cenę orientacyjną; dokumentację techniczną zawsze przygotowuje uprawniony projektant.',
    ],
  },
  {
    slug: 'jak-wybrac-zadaszenie',
    title: 'Lamele, szkło czy poliwęglan?',
    category: 'Poradnik',
    excerpt: 'Wybierz dach dopasowany do światła i potrzeb Twojej przestrzeni.',
    paragraphs: [
      'Lamele pozwalają regulować światło, szkło zachowuje kontakt z niebem, a poliwęglan jest lekkim rozwiązaniem do mniejszych konstrukcji. Każdy materiał wymaga odpowiednio dobranej konstrukcji nośnej.',
      'W orientacyjnej wycenie uwzględniamy powierzchnię dachu, konstrukcję i dodatki. Koszt montażu, fundamentów oraz transportu określa się po pomiarze miejsca inwestycji.',
    ],
  },
  {
    slug: 'naturalne-materialy',
    title: 'Mniej przedmiotów. Więcej jakości.',
    category: 'Materiały',
    excerpt: 'O fakturach, które dobrze się starzeją, i wyborach na dłużej.',
    paragraphs: [
      'Naturalne drewno zmienia kolor i fakturę. To część jego charakteru, ale wymaga regularnej pielęgnacji. Dobieraj wykończenie do miejsca użytkowania.',
      'W naszej koncepcyjnej kolekcji łączymy proste formy z ciepłymi materiałami. Każdy produkt w tym portfolio jest przykładem demonstracyjnym, a nie ofertą sprzedaży.',
    ],
  },
];

export const articles: Article[] = cmsArticles.length ? cmsArticles : baseArticles;
