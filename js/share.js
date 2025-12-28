export function generateShareURL(map) {
    if (!map) return;

    const center = map.getCenter();
    const zoom = map.getZoom();

    // Get Selected Categories
    const checkboxes = document.querySelectorAll('#category-list input:checked');
    const selectedCats = Array.from(checkboxes).map(cb => cb.value);

    // Build URL Params
    const params = new URLSearchParams();
    params.set('lat', center.lat.toFixed(5));
    params.set('lon', center.lng.toFixed(5));
    params.set('z', zoom);

    if (selectedCats.length > 0) {
        // Encode categories to avoid URL issues with Japanese characters
        // URLSearchParams handles encoding automatically
        params.set('cats', selectedCats.join(','));
    }

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    // Copy to Clipboard
    navigator.clipboard.writeText(url).then(() => {
        alert("URLをコピーしました！\n" + url);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        // Fallback for non-secure contexts if needed, but alert shows simple success usually
        prompt("URLをコピーしてください:", url);
    });
}

export function parseURLParams(map) {
    if (!map) return;

    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lon = params.get('lon');
    const zoom = params.get('z');
    const cats = params.get('cats');

    // Restore Map View
    if (lat && lon && zoom) {
        map.setView([parseFloat(lat), parseFloat(lon)], parseInt(zoom));
    }

    // Restore Categories
    if (cats) {
        const catList = cats.split(',');
        const checkboxes = document.querySelectorAll('#category-list input');

        checkboxes.forEach(cb => {
            if (catList.includes(cb.value)) {
                cb.checked = true;
            } else {
                cb.checked = false; // Uncheck if not in list (strict restore)
            }
        });
    }

    return (lat && lon && zoom) || cats; // Return true if valid params found
}
