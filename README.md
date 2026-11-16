# Практична робота №10. Асинхронні запити та обробка результатів

Вебзастосунок для перегляду кошика інтернет-магазину через DummyJSON API (https://dummyjson.com).

- `index.html` - інтерфейс: поле ID кошика, кнопка «Завантажити кошик», режим тестування, стан запиту, помилки, дані кошика.
- `script.js` - `loadCart()`, `requestWithRetry()` (2 спроби, пауза 1000 мс), `fetchJson()` (перевірка `response.ok`, таймаут 4 с через `AbortController`).

Запуск: відкрити `index.html` у браузері.

Режими:
- звичайний запит `https://dummyjson.com/carts/{id}?delay=3000`;
- перша спроба штучно невдала, друга реальна;
- `https://dummyjson.com/http/404/Not_Found`;
- `https://dummyjson.com/http/503/Service_Unavailable`;
- таймаут: `delay=5000` при ліміті 4 с.
