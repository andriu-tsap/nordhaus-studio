# Weryfikacja — 14 listopada 2026

## Wykonane kontrole

| Kontrola | Wynik | Zakres |
| --- | --- | --- |
| ESLint + Prettier | PASS | Źródła TypeScript/JavaScript, konfiguracja, formatowanie |
| Build | PASS | Wspólna domena, Next.js SSG, Angular production, NestJS |
| Vitest | 30/30 PASS | 23 testy domeny + 7 testów HTTP z rzeczywistym PostgreSQL 17 |
| pytest | 2/2 PASS | Puste dane, całkowitoliczbowe kwoty, konwersja i agregacja |
| Playwright | 14/14 PASS | 7 procesów na Chromium desktop + 7 na Chromium z emulacją iPhone 13 |
| Docker API | PASS | Build obrazu, start jako użytkownik node, Prisma/seed, połączenie z PostgreSQL, /health, logowanie, chroniony CRM, PDF z fontem PL |
| Compose config | PASS | Walidacja definicji, zależności usług i zmiennych |
| Lighthouse mobile | 92 / 100 / 100 / 100 | Performance / Accessibility / Best Practices / SEO |
| Lighthouse desktop | 100 / 100 / 100 / 100 | Oficjalny preset desktop Lighthouse |

Test równoczesnej rezerwacji wysyła dwa żądania o ten sam termin. Baza przyjmuje jedno (201), drugie zwraca konflikt (409). API odrzuca nieprawidłowe DTO, obcy Origin, nieznane produkty i brak JWT. Test PDF API sprawdza typ oraz zawartość dokumentu; sprawdzenie kontenera dodatkowo potwierdza nagłówek `%PDF-`.

Playwright sprawdza koszyk i checkout DEMO, wybór wariantu, aktualizację ceny 3D, zapis zapytania, rezerwację i zniknięcie zajętej godziny, guard CRM, zmianę etapu Kanban, eksport CSV, pobranie PDF oraz kontakt. Zrzuty znajdują się w `/screenshots`. Do zestawu użyto systemowego Chromium przez standardowy runner projektu. Nie przeprowadzono ręcznego audytu widocznej sesji Cloud Desktop.

## Warunki Lighthouse

Pomiar strony głównej statycznego DEMO, lokalny serwer HTTP z kompresją gzip (`http-server -g -c3600`). Tryb mobile korzysta z domyślnej symulacji Lighthouse, desktop z oficjalnego `desktop-config`. Pełne raporty JSON i dokładne ustawienia są obok tego pliku. Nie zmieniano ręcznie wyników raportu. Kolejność pomiaru: mobile, desktop; pomiar bez równoległego uruchamiania innych testów.

Wyniki dotyczą strony głównej, nie całego CRM ani sceny WebGL. Wynik dostępności automatycznej nie jest certyfikatem zgodności WCAG. Emulacja telefonu nie zastępuje testu na fizycznym urządzeniu.

## Docker i integracje zewnętrzne

Obraz API zbudowano na Node 24 Alpine, z selektywną instalacją workspace API/domain. W tym zarządzanym środowisku połączenia HTTPS wewnątrz Dockera wymagają certyfikatu sesji. Na czas testu przekazano go jako sekret BuildKit do instalacji apk/npm; nie zapisano certyfikatu w repozytorium ani obrazie. Tymczasowy wariant Dockerfile zmieniał wyłącznie zaufanie TLS podczas instalacji. Runtime działał jako `node`, z PostgreSQL w osobnym kontenerze.

Nie uruchomiono jednocześnie całego stosu Compose (w tym WordPress/MySQL i Nginx), ze względu na limit dysku oraz sterownik Docker VFS w środowisku. WordPress/WooCommerce seed i blueprint są dostarczone, lecz nie deklarujemy ich testu end-to-end na żywej instalacji. Nie wykonano zewnętrznej płatności Stripe ani wysyłki SMTP do prawdziwej skrzynki — wymagają kont i konfiguracji operatora. DOMYŚLNY DEMO nie używa tych usług.

## Publikacja

GitHub zwrócił `Resource not accessible by integration (createRepository)`. Repozytorium `andriu-tsap/nordhaus-studio` nie zostało utworzone, kod nie został wypchnięty do GitHub, a GitHub Actions/Pages nie były uruchomione. Gotowy workflow znajduje się w źródłach.

Przygotowano osobne statyczne demo na Sites z domyślnym prywatnym dostępem właściciela. Publiczne udostępnienie klientom wymaga zmiany odbiorców w Sites lub publikacji Pages po utworzeniu repozytorium. Archiwum zawiera pełne źródła i gotowy statyczny katalog `demo`.
