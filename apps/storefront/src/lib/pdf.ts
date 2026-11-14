import { jsPDF } from 'jspdf';
import { calculatePrice, money, type PriceBook, type Configuration } from '@nordhaus/domain';
import { base } from './client';
export async function exportQuote(
  c: Configuration,
  canvas?: HTMLCanvasElement | null,
  book?: PriceBook,
) {
  const pdf = new jsPDF();
  const buffer = await fetch(`${base}/fonts/DejaVuSans.ttf`).then((r) => {
    if (!r.ok) throw new Error('Nie udało się załadować czcionki PDF');
    return r.arrayBuffer();
  });
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  pdf.addFileToVFS('DejaVuSans.ttf', btoa(binary));
  pdf.addFont('DejaVuSans.ttf', 'Nordhaus', 'normal');
  pdf.setFont('Nordhaus');
  pdf.setFillColor('#233d35');
  pdf.rect(0, 0, 210, 46, 'F');
  pdf.setTextColor('#ffffff');
  pdf.setFontSize(24);
  pdf.text('nordhaus / projekt pergoli', 16, 26);
  pdf.setTextColor('#303735');
  pdf.setFontSize(10);
  pdf.text('PROJEKT KONCEPCYJNY — FIKCYJNA MARKA — WYCENA ORIENTACYJNA', 16, 57);
  if (canvas) pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 16, 66, 178, 100);
  let y = canvas ? 180 : 80;
  const price = calculatePrice(c, book);
  for (const line of [
    `Wymiary: ${c.width} × ${c.depth} × ${c.height} m`,
    `Dach: ${{ louvres: 'Lamele', glass: 'Szkło', polycarbonate: 'Poliwęglan' }[c.roof]}`,
    `Kolor: ${c.ral} | LED: ${c.led ? 'Tak' : 'Nie'} | Rolety: ${c.blinds ? 'Tak' : 'Nie'}`,
    `Netto: ${money(price.net)} | VAT 23%: ${money(price.vat)}`,
    `Łącznie brutto: ${money(price.gross)}`,
  ]) {
    pdf.text(line, 16, y);
    y += 10;
  }
  pdf.setFontSize(9);
  pdf.text(
    pdf.splitTextToSize(
      'Bez montażu, fundamentów i transportu. Nie jest ofertą handlową ani dokumentacją techniczną. Projekt demonstracyjny Andrii Tsap. Dane są przechowywane lokalnie w trybie DEMO.',
      178,
    ),
    16,
    y + 8,
  );
  pdf.save('nordhaus-projekt-pergoli.pdf');
}
