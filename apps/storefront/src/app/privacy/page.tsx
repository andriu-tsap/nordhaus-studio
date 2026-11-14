export const metadata = { title: 'Prywatność i regulamin demonstracji' };
export default function Privacy() {
  return (
    <article className="section article">
      <p className="eyebrow">TRANSPARENTNE ZASADY</p>
      <h1>
        Prywatność
        <br />
        <em>i zasady demo.</em>
      </h1>
      <h2>Projekt koncepcyjny</h2>
      <p>
        Nordhaus Studio to fikcyjna marka w portfolio Andrii Tsap. Nie prowadzimy sklepu ani
        sprzedaży. Ceny, osoby i produkty są przykładami. Rezerwacje nie oznaczają rzeczywistych
        spotkań. Nie publikujemy opinii klientów ani wyników biznesowych.
      </p>
      <h2>Tryb DEMO</h2>
      <p>
        Koszyk, konfiguracja, zapytania i rezerwacje są zapisywane w localStorage na Twoim
        urządzeniu. Używaj fikcyjnych danych. Dane nie są wysyłane do firmy; możesz je usunąć w
        ustawieniach witryny przeglądarki. Panel CRM działa na tym samym pochodzeniu adresu.
      </p>
      <h2>Tryb API</h2>
      <p>
        Jeśli operator uruchomi backend, formularze zapisują dane kontaktowe w jego bazie. Przed
        udostępnieniem takiej instalacji operator musi określić administratora danych, cel i
        podstawę prawną przetwarzania, okres retencji oraz sposób realizacji praw użytkownika.
        Przykładowa instalacja nie służy do obsługi prawdziwych danych.
      </p>
      <h2>Płatności i analityka</h2>
      <p>
        Płatności obsługujemy wyłącznie przez testowy Stripe. Nie wpisuj danych prawdziwej karty.
        Analityka nie jest uruchomiona; przygotowany interfejs dataLayer wymaga osobnej konfiguracji
        i prawidłowej zgody użytkownika.
      </p>
      <h2>Zdjęcia i kod</h2>
      <p>
        Fotografie poglądowe pochodzą z Unsplash; zestawienie źródeł zawiera plik ASSETS.md. Nie
        przedstawiają rzeczywistych produktów ani realizacji marki. Kod projektu: licencja MIT.
      </p>
    </article>
  );
}
