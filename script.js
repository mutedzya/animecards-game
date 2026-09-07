let characters = [];
let state = { coins: 100, lastDaily: null, owned: {} };
const $ = s => document.querySelector(s);

async function init() {
    characters = await fetch("data/characters.json").then(r => r.json());
    loadState();
    dailyCoins();
    buildSeries();
    render();
    resolveImages();
}

function loadState() {
    try {
        const x = JSON.parse(localStorage.getItem("animecards-state"));
        if (x) state = { ...state, ...x };
    } catch (e) {}
}

function save() {
    localStorage.setItem("animecards-state", JSON.stringify(state));
}

function dailyCoins() {
    const today = new Date().toISOString().slice(0, 10);
    if (state.lastDaily === null) {
        state.lastDaily = today;
        save();
    } else if (state.lastDaily !== today) {
        state.coins += 100;
        state.lastDaily = today;
        save();
    }
    updateWallet();
}

function updateWallet() {
    $("#coins").textContent = state.coins;
}

function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    }[m]));
}

function image(c) {
    return c.image ? `<img loading="lazy" src="${esc(c.image)}" alt="${esc(c.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">` : "";
}

function cardHTML(c, owned = true) {
    return `<div class="card">
        <div class="art">
            ${owned ? image(c) : ""}
            <div class="placeholder" style="display:${owned && c.image ? 'none' : 'grid'}">
                ${owned ? esc((c.name || "?")[0]) : "?"}
            </div>
            <span class="rarity">${owned ? '★'.repeat(c.rarity) : '???'}</span>
        </div>
        <div class="info">
            <div>
                <strong>${owned ? esc(c.name) : "???"}</strong>
                <small>${owned ? esc(c.series) : "Not discovered"}</small>
            </div>
            ${owned ? `<span class="owned">x${state.owned[c.id] || 1}</span>` : ""}
        </div>
    </div>`;
}

function render() {
    updateWallet();
    const list = characters.filter(c => {
        const q = $("#search").value.toLowerCase().trim();
        const s = $("#series").value;
        return (!q || `${c.name} ${c.series}`.toLowerCase().includes(q)) && (s === 'all' || c.series === s);
    });
    $("#collectionCount").textContent = Object.keys(state.owned).length + " / 100 unique";
    $("#collectionGrid").innerHTML = list.map(c => cardHTML(c, !!state.owned[c.id])).join("");

    const first = characters.find(c => state.owned[c.id]) || characters[0];
    if (first) $("#heroCard").innerHTML = cardHTML(first, !!state.owned[first.id]);
}

function buildSeries() {
    const ss = [...new Set(characters.map(c => c.series))];
    $("#series").innerHTML = '<option value="all">All series</option>' + ss.map(s => `<option>${esc(s)}</option>`).join("");
}

function randomCard() {
    const pool = characters.flatMap(c => Array(Math.max(1, 8 - c.rarity)).fill(c));
    return pool[Math.floor(Math.random() * pool.length)];
}

function openPack() {
    if (state.coins < 10) {
        alert("You need 10 coins!");
        return;
    }
    state.coins -= 10;
    const pulled = [];
    let duplicateCoins = 0;

    for (let i = 0; i < 3; i++) {
        const c = randomCard();
        pulled.push(c);
        state.owned[c.id] = (state.owned[c.id] || 0) + 1;
        if (state.owned[c.id] > 1) duplicateCoins += 5;
    }

    state.coins += duplicateCoins;
    save();
    render();

    $("#newCards").innerHTML = pulled.map(c => `<div class="new-card">${cardHTML(c, true)}</div>`).join("");
    $("#packResult").textContent = duplicateCoins ? `Duplicates converted to +${duplicateCoins} coins.` : "No duplicates this time!";
    $("#opening").classList.remove("hidden");
}

function closeOpening() {
    $("#opening").classList.add("hidden");
}

$("#search").addEventListener("input", render);
$("#series").addEventListener("change", render);

async function resolveImages() {
    for (let start = 0; start < characters.length; start += 20) {
        const batch = characters.slice(start, start + 20);
        const fields = batch.map((c, i) => `c${i}: Character(search: ${JSON.stringify(c.imageSearch)}) { image { large } }`).join(" ");

        try {
            const res = await fetch("https://graphql.anilist.co", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: `query { ${fields} }` })
            });
            const j = await res.json();
            batch.forEach((c, i) => {
                const url = j.data?.['c' + i]?.image?.large;
                if (url) c.image = url;
            });
            render();
        } catch (e) {
            console.warn('Image lookup failed', e);
            break;
        }
    }
}

init();