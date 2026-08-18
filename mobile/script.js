(() => {
    'use strict';

    const LS = {
        get(k, d = null) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
        set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
    };

    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    const searchEngines = {
        yandex: 'https://yandex.ru/search/?text=',
        google: 'https://www.google.com/search?q=',
        duckduckgo: 'https://duckduckgo.com/?q=',
        bing: 'https://www.bing.com/search?q='
    };

    const SITE_ICONS = {
        youtube: '#FF0000', vk: '#4C76A9', google: '#4285F4',
        telegram: '#0088CC', wikipedia: '#636466', reddit: '#FF4500',
        github: '#333333', spotify: '#1DB954'
    };

    // Clock & Date
    function updateClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const time = `${h}:${m}`;

        $('#clock').textContent = time;
        $('#statusTime').textContent = time;

        const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
        $('#date').textContent = `${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()}`;

        const hour = now.getHours();
        let greet = 'Доброй ночи';
        if (hour >= 5 && hour < 12) greet = 'Доброе утро';
        else if (hour >= 12 && hour < 17) greet = 'Добрый день';
        else if (hour >= 17 && hour < 21) greet = 'Добрый вечер';
        $('#greeting').textContent = greet;
    }
    updateClock();
    setInterval(updateClock, 10000);

    // Navigation
    const pages = ['home', 'history', 'favorites', 'settings'];

    function switchPage(page) {
        $$('.page').forEach(p => p.classList.remove('active'));
        $(`#page${page.charAt(0).toUpperCase() + page.slice(1)}`).classList.add('active');
        $$('.nav-item').forEach(n => n.classList.remove('active'));
        $(`.nav-item[data-page="${page}"]`).classList.add('active');
        $('#mainContent').scrollTop = 0;

        if (page === 'history') renderHistory();
        if (page === 'favorites') renderFavorites();
    }

    $$('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => switchPage(btn.dataset.page));
    });

    // Search
    let currentEngine = LS.get('searchEngine', 'yandex');

    function getSearchUrl(q) {
        return searchEngines[currentEngine] + encodeURIComponent(q);
    }

    $('#searchInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const q = e.target.value.trim();
            if (q) {
                addHistory({ title: q, url: getSearchUrl(q), type: 'search', time: Date.now() });
                window.location.href = getSearchUrl(q);
            }
        }
    });

    $('#searchInput').addEventListener('input', e => {
        const v = e.target.value;
        $('#searchClear').classList.toggle('visible', v.length > 0);
        updateAutocomplete(v);
    });

    $('#searchClear').addEventListener('click', () => {
        $('#searchInput').value = '';
        $('#searchClear').classList.remove('visible');
        $('#autocomplete').classList.remove('visible');
        $('#autocomplete').innerHTML = '';
    });

    // Autocomplete
    let abortCtrl = null;

    async function updateAutocomplete(query) {
        const ac = $('#autocomplete');
        if (query.length < 2) { ac.classList.remove('visible'); return; }

        if (abortCtrl) abortCtrl.abort();
        abortCtrl = new AbortController();

        try {
            const r = await fetch(`https://suggest.yandex.net/suggest-ya.cgi?part=${encodeURIComponent(query)}&srv=opensearch`, {
                signal: abortCtrl.signal
            });
            const data = await r.json();
            const suggestions = data[1] || [];

            if (suggestions.length === 0) { ac.classList.remove('visible'); return; }

            ac.innerHTML = suggestions.slice(0, 6).map(s =>
                `<div class="autocomplete-item" data-query="${s.replace(/"/g, '&quot;')}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <span>${s}</span>
                </div>`
            ).join('');
            ac.classList.add('visible');

            ac.querySelectorAll('.autocomplete-item').forEach(item => {
                item.addEventListener('click', () => {
                    const q = item.dataset.query;
                    addHistory({ title: q, url: getSearchUrl(q), type: 'search', time: Date.now() });
                    window.location.href = getSearchUrl(q);
                });
            });
        } catch { }
    }

    document.addEventListener('click', e => {
        if (!e.target.closest('.search-container')) {
            $('#autocomplete').classList.remove('visible');
        }
    });

    // Quick sites - track visits
    $$('.site-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const url = item.href;
            const name = item.querySelector('span').textContent;
            const site = item.dataset.site;
            addHistory({ title: name, url, type: 'site', site, time: Date.now() });
            window.location.href = url;
        });
    });

    // History
    function getHistory() { return LS.get('history', []); }

    function addHistory(entry) {
        const h = getHistory();
        h.unshift(entry);
        if (h.length > 100) h.length = 100;
        LS.set('history', h);
    }

    function renderHistory() {
        const h = getHistory();
        const list = $('#historyList');
        const empty = $('#historyEmpty');

        list.querySelectorAll('.list-item').forEach(i => i.remove());

        if (h.length === 0) {
            empty.style.display = '';
            return;
        }
        empty.style.display = 'none';

        h.forEach((item, idx) => {
            const el = document.createElement('div');
            el.className = 'list-item';
            const initial = item.title.charAt(0).toUpperCase();
            const color = (item.site && SITE_ICONS[item.site]) || '#B8860B';
            const hostname = item.url ? new URL(item.url).hostname : '';

            el.innerHTML = `
                <div class="list-item-icon" style="background:${color}">${initial}</div>
                <div class="list-item-info">
                    <div class="list-item-title">${item.title}</div>
                    <div class="list-item-url">${hostname}</div>
                </div>
                <button class="list-item-delete" data-idx="${idx}">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>`;

            el.addEventListener('click', e => {
                if (e.target.closest('.list-item-delete')) return;
                window.location.href = item.url;
            });

            el.querySelector('.list-item-delete').addEventListener('click', e => {
                e.stopPropagation();
                const hist = getHistory();
                hist.splice(idx, 1);
                LS.set('history', hist);
                renderHistory();
                toast('Удалено из истории');
            });

            list.appendChild(el);
        });
    }

    $('#clearHistory').addEventListener('click', () => {
        LS.set('history', []);
        renderHistory();
        toast('История очищена');
    });

    // Favorites
    function getFavorites() { return LS.get('favorites', []); }

    function renderFavorites() {
        const favs = getFavorites();
        const list = $('#favoritesList');
        const empty = $('#favoritesEmpty');

        list.querySelectorAll('.list-item').forEach(i => i.remove());

        if (favs.length === 0) {
            empty.style.display = '';
            return;
        }
        empty.style.display = 'none';

        favs.forEach((item, idx) => {
            const el = document.createElement('div');
            el.className = 'list-item';
            const initial = item.name.charAt(0).toUpperCase();

            el.innerHTML = `
                <div class="list-item-icon" style="background:${item.color || '#B8860B'}">${initial}</div>
                <div class="list-item-info">
                    <div class="list-item-title">${item.name}</div>
                    <div class="list-item-url">${item.url}</div>
                </div>
                <button class="list-item-delete" data-idx="${idx}">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>`;

            el.addEventListener('click', e => {
                if (e.target.closest('.list-item-delete')) return;
                window.location.href = item.url;
            });

            el.querySelector('.list-item-delete').addEventListener('click', e => {
                e.stopPropagation();
                const fav = getFavorites();
                fav.splice(idx, 1);
                LS.set('favorites', fav);
                renderFavorites();
                toast('Удалено из избранного');
            });

            list.appendChild(el);
        });
    }

    // Favorite Modal
    let editFavIdx = -1;

    function openModal(idx = -1) {
        editFavIdx = idx;
        const modal = $('#favoriteModal');
        const title = $('#modalTitle');

        if (idx >= 0) {
            title.textContent = 'Редактировать';
            const fav = getFavorites()[idx];
            $('#favName').value = fav.name;
            $('#favUrl').value = fav.url;
            $('#favColor').value = fav.color || '#B8860B';
        } else {
            title.textContent = 'Добавить в избранное';
            $('#favName').value = '';
            $('#favUrl').value = '';
            $('#favColor').value = '#B8860B';
        }

        modal.classList.add('visible');
        setTimeout(() => $('#favName').focus(), 100);
    }

    function closeModal() {
        $('#favoriteModal').classList.remove('visible');
        editFavIdx = -1;
    }

    $('#addFavorite').addEventListener('click', () => openModal());
    $('#modalCancel').addEventListener('click', closeModal);

    $('#favoriteModal').addEventListener('click', e => {
        if (e.target === $('#favoriteModal')) closeModal();
    });

    $('#modalSave').addEventListener('click', () => {
        const name = $('#favName').value.trim();
        let url = $('#favUrl').value.trim();
        const color = $('#favColor').value.trim();

        if (!name || !url) { toast('Заполните все поля'); return; }
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

        const favs = getFavorites();
        if (editFavIdx >= 0) {
            favs[editFavIdx] = { name, url, color };
            toast('Обновлено');
        } else {
            favs.push({ name, url, color });
            toast('Добавлено в избранное');
        }
        LS.set('favorites', favs);
        closeModal();
        renderFavorites();
    });

    // Settings
    const savedEngine = LS.get('searchEngine', 'yandex');
    const savedTheme = LS.get('theme', 'dark');

    $(`input[name="searchEngine"][value="${savedEngine}"]`).checked = true;
    $(`input[name="theme"][value="${savedTheme}"]`).checked = true;
    document.body.dataset.theme = savedTheme;

    $$('#searchEngineOptions input').forEach(input => {
        input.addEventListener('change', () => {
            currentEngine = input.value;
            LS.set('searchEngine', input.value);
            const names = { yandex: 'Яндекс', google: 'Google', duckduckgo: 'DuckDuckGo', bing: 'Bing' };
            toast(`Поисковик: ${names[input.value]}`);
        });
    });

    $$('#themeOptions input').forEach(input => {
        input.addEventListener('change', () => {
            document.body.dataset.theme = input.value;
            LS.set('theme', input.value);

            const meta = $('meta[name="theme-color"]');
            const colors = { dark: '#0a0a0f', light: '#f0f0f5', gold: '#0d0b00' };
            meta.content = colors[input.value];

            const names = { dark: 'Тёмная', light: 'Светлая', gold: 'Золотая' };
            toast(`Тема: ${names[input.value]}`);
        });
    });

    // Toast
    let toastTimer = null;
    function toast(msg) {
        const t = $('#toast');
        t.textContent = msg;
        t.classList.add('visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('visible'), 2200);
    }
})();
