# Nordhaus Studio — готовий пакет портфоліо

Один проєкт об'єднує магазин, WordPress CMS, 3D-конфігуратор, бронювання та CRM. Автор: Andrii Tsap.

## Найшвидший перегляд

Живе демо: https://andriu-tsap.github.io/nordhaus-studio/ · CRM: https://andriu-tsap.github.io/nordhaus-studio/studio/ (логін **demo**, пароль **demo123**).

## Повний запуск

```bash
python scripts/init-env.py
docker compose up --build -d
```

Адреса: http://localhost:8088/. Детальні польські інструкції та режими DEMO/API — у README.md. Серверні паролі генеруються локально; їх немає в архіві.

## Що перевірено

30 тестів TypeScript/API з PostgreSQL, 2 тести Python, 14 сценаріїв Playwright на desktop/mobile. Lighthouse головної сторінки: mobile 92/100/100/100, desktop 100/100/100/100. Порядок: продуктивність / доступність / best practices / SEO. Звіти JSON та межі перевірки — у `reports`; скриншоти — у `screenshots`.

Сторінка є демонстрацією вигаданої марки. Оплата — лише тестова; фактури — демонстраційні. Це не магазин, що приймає реальні замовлення.

## Публікація

Код: https://github.com/andriu-tsap/nordhaus-studio. Демо публікується з гілки `gh-pages` (статичний експорт Next.js + Angular CRM).
