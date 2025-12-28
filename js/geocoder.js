export async function searchLocation(query) {
    if (!query || query.trim() === "") return null;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'DeepTourismMap/1.0' // Polite User-Agent
            }
        });

        if (!response.ok) {
            throw new Error(`Geocoding error: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
            // Return top result
            const top = data[0];
            return {
                lat: parseFloat(top.lat),
                lon: parseFloat(top.lon),
                name: top.display_name
            };
        } else {
            return null;
        }
    } catch (e) {
        console.error("Geocoding failed:", e);
        return null; // Handle error gracefully
    }
}
