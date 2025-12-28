export const REGIONS = {
    "今いる場所 (デフォルト)": [34.9858, 135.7588, 13],
    "北海道 (札幌)": [43.0618, 141.3545, 10],
    "東北 (仙台)": [38.2682, 140.8694, 10],
    "関東 (東京)": [35.6895, 139.6917, 10],
    "中部 (名古屋)": [35.1815, 136.9066, 10],
    "近畿 (大阪)": [34.6937, 135.5023, 10],
    "中国 (広島)": [34.3853, 132.4553, 10],
    "四国 (高松)": [34.3428, 134.0466, 10],
    "九州 (福岡)": [33.5904, 130.4017, 10],
    "沖縄 (那覇)": [26.2124, 127.6809, 10]
};

export const TOURISM_FILTERS = {
    "📸 絶景・自然": [
        'node["tourism"="viewpoint"]',
        'node["natural"="peak"]',
        'node["waterway"="waterfall"]',
        'node["natural"="beach"]',
        'way["natural"="beach"]',
        'node["leisure"="park"]'
    ],
    "⛩️ 歴史・神社仏閣": [
        'node["historic"~"castle|ruins|memorial|monument"]',
        'way["historic"~"castle|ruins"]',
        'node["amenity"="place_of_worship"]',
        'way["amenity"="place_of_worship"]',
        'node["historic"="wayside_shrine"]'
    ],
    "🎨 芸術・博物館": [
        'node["tourism"="museum"]',
        'node["tourism"="artwork"]',
        'node["tourism"="gallery"]',
        'way["tourism"="museum"]'
    ],
    "♨️ 温泉・リラックス": [
        'node["amenity"="public_bath"]',
        'node["natural"="hot_spring"]',
        'node["tourism"="hotel"]'
    ],
    "🎡 エンタメ・体験": [
        'node["tourism"="theme_park"]',
        'node["tourism"="zoo"]',
        'node["tourism"="aquarium"]',
        'node["leisure"="resort"]'
    ],
    "🍴 グルメ・食事": [
        'node["amenity"="restaurant"]',
        'node["amenity"="cafe"]',
        'node["amenity"="fast_food"]',
        'node["amenity"="food_court"]'
    ]
};
