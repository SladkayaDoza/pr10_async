const API = 'https://dummyjson.com';
const MAX_ATTEMPTS = 2;
const RETRY_PAUSE = 1000;
const TIMEOUT = 4000;

const cartIdInput = document.getElementById('cartId');
const modeSelect = document.getElementById('mode');
const loadBtn = document.getElementById('loadBtn');
const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const errorEl = document.getElementById('error');
const cartEl = document.getElementById('cart');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function setStatus(text) {
    statusEl.textContent = text;
}

function addLog(text) {
    const li = document.createElement('li');
    li.textContent = `${new Date().toLocaleTimeString()} - ${text}`;
    logEl.appendChild(li);
}

function showError(text) {
    errorEl.textContent = text;
}

function hideError() {
    errorEl.textContent = '';
}

function buildUrl(id, mode) {
    switch (mode) {
        case 'http404': return `${API}/http/404/Not_Found`;
        case 'http503': return `${API}/http/503/Service_Unavailable`;
        case 'timeout': return `${API}/carts/${id}?delay=5000`;
        default: return `${API}/carts/${id}?delay=3000`;
    }
}

async function fetchJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            let details = '';
            try {
                const body = await response.json();
                details = body.message ? ` (${body.message})` : '';
            } catch (e) { }
            throw new Error(`HTTP ${response.status} ${response.statusText}${details}`);
        }
        return await response.json();
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error(`сервер не відповів за ${TIMEOUT / 1000} с (таймаут)`);
        }
        if (err instanceof TypeError) {
            throw new Error('немає з\'єднання з сервером (мережева помилка)');
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

async function requestWithRetry(url, failFirst = false) {
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        setStatus(`Спроба ${attempt} із ${MAX_ATTEMPTS}. Завантаження кошика… Будь ласка, зачекайте.`);
        addLog(`Спроба ${attempt} із ${MAX_ATTEMPTS}: GET ${url}`);
        try {
            if (failFirst && attempt === 1) {
                await sleep(500);
                throw new Error('штучна помилка тестового режиму');
            }
            const data = await fetchJson(url);
            addLog(`Спроба ${attempt} успішна`);
            return data;
        } catch (err) {
            lastError = err;
            addLog(`Спроба ${attempt} невдала: ${err.message}`);
            if (attempt < MAX_ATTEMPTS) {
                setStatus(`Спроба ${attempt} невдала: ${err.message}. Повторна спроба через ${RETRY_PAUSE / 1000} с…`);
                await sleep(RETRY_PAUSE);
            }
        }
    }
    throw lastError;
}

function money(value) {
    return value.toFixed(2);
}

function renderCart(cart) {
    const rows = cart.products.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${p.title}</td>
            <td>${money(p.price)}</td>
            <td>${p.quantity}</td>
            <td>${money(p.price * p.quantity)}</td>
        </tr>`).join('');

    cartEl.innerHTML = `
        <h2>Кошик №${cart.id} (користувач ${cart.userId})</h2>
        <table>
            <thead>
                <tr><th>№</th><th>Товар</th><th>Ціна, $</th><th>Кількість</th><th>Вартість, $</th></tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <p>
            Різних товарів: ${cart.totalProducts}, одиниць: ${cart.totalQuantity}<br>
            Загальна сума: <b>${money(cart.total)} $</b><br>
            Сума зі знижкою: ${money(cart.discountedTotal)} $
        </p>`;
}

async function loadCart(id) {
    const mode = modeSelect.value;
    const url = buildUrl(id, mode);

    loadBtn.disabled = true;
    hideError();
    cartEl.innerHTML = '';
    logEl.innerHTML = '';

    try {
        const data = await requestWithRetry(url, mode === 'failFirst');
        if (!Array.isArray(data.products)) {
            throw new Error('відповідь сервера не містить даних кошика');
        }
        renderCart(data);
        setStatus(`Кошик №${data.id} успішно завантажено.`);
    } catch (err) {
        setStatus('Не вдалося завантажити кошик.');
        showError(`Помилка запиту: ${err.message}. Обидві спроби невдалі. ` +
            'Перевірте ID кошика або з\'єднання та натисніть «Завантажити кошик», щоб спробувати ще раз.');
    } finally {
        loadBtn.disabled = false;
    }
}

loadBtn.addEventListener('click', () => {
    const id = Number(cartIdInput.value);
    if (!Number.isInteger(id) || id < 1) {
        hideError();
        showError('Введіть коректний ідентифікатор кошика (ціле число від 1).');
        return;
    }
    loadCart(id);
});
