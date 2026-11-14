import PDFDocument from 'pdfkit';
import { calculatePrice, money, type Configuration, type PriceBook } from '@nordhaus/domain';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
export async function quotePdf(id: string, c: Configuration, book?: PriceBook): Promise<Buffer> {
  return new Promise((resolvePdf, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 45 });
    const chunks: Buffer[] = [];
    doc.on('data', (b: Buffer) => chunks.push(b));
    doc.on('end', () => resolvePdf(Buffer.concat(chunks)));
    doc.on('error', reject);
    const font = [
      resolve('assets/DejaVuSans.ttf'),
      resolve('../storefront/public/fonts/DejaVuSans.ttf'),
    ].find(existsSync);
    if (font) doc.font(font);
    const p = calculatePrice(c, book);
    doc.fillColor('#253a32').fontSize(26).text('nordhaus / oferta koncepcyjna');
    doc
      .moveDown()
      .fontSize(11)
      .text(`Numer: ${id}`)
      .text('Projekt koncepcyjny do portfolio — fikcyjna marka');
    doc
      .moveDown()
      .text(`Wymiary: ${c.width} × ${c.depth} × ${c.height} m`)
      .text(`Dach: ${c.roof} | Kolor: ${c.ral}`)
      .text(`LED: ${c.led ? 'Tak' : 'Nie'} | Roleta: ${c.blinds ? 'Tak' : 'Nie'}`);
    doc
      .moveDown()
      .fontSize(18)
      .text(`Brutto: ${money(p.gross)}`)
      .fontSize(11)
      .text(`Netto: ${money(p.net)} | VAT: ${money(p.vat)}`);
    doc
      .moveDown()
      .text(
        'Cena orientacyjna. Bez montażu, fundamentów i transportu. Dokument nie jest fakturą ani ofertą handlową. Nie zastępuje projektu konstrukcyjnego.',
      );
    doc.end();
  });
}
