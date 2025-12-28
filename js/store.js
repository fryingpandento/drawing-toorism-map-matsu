let favoritesLayer; // Layer Group for favorites
let favoriteIds = new Set(); // Set of IDs

export function initFavorites(map) {
    favoritesLayer = L.layerGroup().addTo(map);
    loadFavorites();
}

export function isFavorite(name) {
    return favoriteIds.has(name);
}

export function toggleFavorite(name, lat, lon, btn, markerClass) {
    const safeName = name.replace(/'/g, "\\'");
    if (favoriteIds.has(name)) {
        // Remove
        favoriteIds.delete(name);
        removeFromFavoritesLayer(name);
        if (btn) {
            btn.textContent = "☆ ピン留め";
            btn.classList.remove('active');
        }
    } else {
        // Add
        favoriteIds.add(name);
        addToFavoritesLayer(name, lat, lon, markerClass);
        if (btn) {
            btn.textContent = "★ ピン留め済";
            btn.classList.add('active');
        }
    }
    saveFavorites();
}

export function removeFavorite(name) {
    if (favoriteIds.has(name)) {
        favoriteIds.delete(name);
        removeFromFavoritesLayer(name);
        saveFavorites();

        const buttons = document.querySelectorAll('.pin-btn.active');
        buttons.forEach(btn => {
            if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(name.replace(/'/g, "\\'"))) {
                btn.textContent = "☆ ピン留め";
                btn.classList.remove('active');
            }
        });
    }
    // Remove popup if open? Already handled by onclick usually.
    const map = favoritesLayer._map; // Hack: access map from layer
    if (map) map.closePopup();
}

export function addToFavoritesLayer(name, lat, lon, markerClass) {
    // Ensure markerClass isn't undefined or null string
    const cls = markerClass || '';

    // Create Custom Icon
    const icon = L.divIcon({
        className: `custom-marker ${cls}`,
        iconSize: [20, 20],
        iconAnchor: [10, 10], // Center it
        popupAnchor: [0, -10]
    });

    const marker = L.marker([lat, lon], { title: name, icon: icon }).addTo(favoritesLayer);
    marker.customId = name;
    marker.customClass = cls; // Save for persistence

    // Popup with Unpin Button
    const safeName = name.replace(/'/g, "\\'");
    const popupContent = `
        <div style="text-align:center;">
            <b>${name}</b><br>
            <span style="color:#ffd700;">★ お気に入り</span><br>
            <button onclick="window.removeFavorite('${safeName}')" style="margin-top:5px; padding:3px 8px; cursor:pointer;">
                解除
            </button>
        </div>
    `;
    marker.bindPopup(popupContent);
}

export function removeFromFavoritesLayer(name) {
    favoritesLayer.eachLayer(layer => {
        if (layer.customId === name) {
            favoritesLayer.removeLayer(layer);
        }
    });
}

export function saveFavorites() {
    const favs = [];
    favoritesLayer.eachLayer(layer => {
        const latlng = layer.getLatLng();
        favs.push({
            name: layer.customId,
            lat: latlng.lat,
            lon: latlng.lng,
            markerClass: layer.customClass
        });
    });
    localStorage.setItem('map_favorites', JSON.stringify(favs));
}

export function loadFavorites() {
    try {
        const saved = localStorage.getItem('map_favorites');
        if (saved) {
            const favs = JSON.parse(saved);
            favs.forEach(f => {
                favoriteIds.add(f.name);
                addToFavoritesLayer(f.name, f.lat, f.lon, f.markerClass);
            });
        }
    } catch (e) {
        console.error("Failed to load favorites", e);
    }
}

export function getFavorites() {
    const favs = [];
    if (favoritesLayer) {
        favoritesLayer.eachLayer(layer => {
            const latlng = layer.getLatLng();
            favs.push({
                name: layer.customId,
                lat: latlng.lat,
                lon: latlng.lng,
                markerClass: layer.customClass
            });
        });
    }
    return favs;
}
