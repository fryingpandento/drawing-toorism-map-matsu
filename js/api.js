import { TOURISM_FILTERS } from './config.js';
import { displayResults } from './ui.js';

let allSpots = [];

export async function searchSpots(layer) {
    const statusMsg = document.getElementById('status-msg');
    statusMsg.textContent = "検索中...";

    // 1. Get Selected Categories
    const checkboxes = document.querySelectorAll('#category-list input:checked');
    const selectedCats = Array.from(checkboxes).map(cb => cb.value);

    if (selectedCats.length === 0) {
        alert("カテゴリを選択してください");
        statusMsg.textContent = "";
        return;
    }

    // 2. Build Area Filter
    let areaFilter = "";

    // Always use BBox
    const bounds = layer.getBounds();
    const searchCenter = bounds.getCenter(); // Center for distance calc

    // Overpass BBox: (south, west, north, east)
    areaFilter = `(${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()})`;

    // 3. Build Query
    let queryParts = "";
    selectedCats.forEach(cat => {
        if (TOURISM_FILTERS[cat]) {
            TOURISM_FILTERS[cat].forEach(q => {
                queryParts += `${q}${areaFilter};\n`;
            });
        }
    });

    const overpassQuery = `
    [out:json][timeout:30];
    (
      ${queryParts}
    );
    // Keep only named items
    (._; >;);
    out center body;
    `;

    try {
        const response = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: "data=" + encodeURIComponent(overpassQuery)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("JSON Parse Error. Response was:", text);
            throw new Error("Invalid JSON response from API");
        }

        const elements = data.elements || [];

        // 4. Client-side Processing
        const seen = new Set();
        allSpots = [];

        elements.forEach(el => {
            const tags = el.tags || {};
            const name = tags.name;

            if (!name) return;
            if (seen.has(name)) return;

            seen.add(name);

            // Calc lat/lon
            const lat = el.lat || (el.center && el.center.lat);
            const lon = el.lon || (el.center && el.center.lon);

            if (lat && lon) {
                try {
                    const latNum = Number(lat);
                    const lonNum = Number(lon);
                    const point = L.latLng(latNum, lonNum);
                    const dist = searchCenter.distanceTo(point);

                    allSpots.push({ ...el, lat: latNum, lon: lonNum, distance: dist });
                } catch (err) {
                    console.warn("Skipping invalid spot:", err);
                }
            }
        });

        // Sort by Distance
        allSpots.sort((a, b) => a.distance - b.distance);

        statusMsg.textContent = `完了: ${allSpots.length}件`;

        // --- Client-side Filtering based on Input ---
        applyFilters();

    } catch (e) {
        console.error("Search failed:", e);
        statusMsg.textContent = "エラーが発生しました: " + e.message;
        alert("データ取得に失敗しました: " + e.message);
    }
}

export function applyFilters() {
    const text = document.getElementById('filter-text').value.toLowerCase();
    const web = document.getElementById('filter-web').checked;
    const wiki = document.getElementById('filter-wiki').checked;
    const hours = document.getElementById('filter-hours').checked;

    const filtered = allSpots.filter(spot => {
        const tags = spot.tags || {};
        const name = tags.name || "";

        if (text && !name.toLowerCase().includes(text)) return false;
        if (web && !tags.website) return false;
        if (wiki && !tags.wikipedia) return false;
        if (hours && !tags.opening_hours) return false;

        return true;
    });

    displayResults(filtered);
}
