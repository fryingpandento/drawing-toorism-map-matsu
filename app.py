import streamlit as st
import folium
from folium.plugins import Draw
from streamlit_folium import st_folium
import requests
import urllib.parse

# 観光に特化した「濃い」タグ設定
REGIONS = {
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
}

TOURISM_FILTERS = {
    "📸 絶景・自然": [
        'node["tourism"="viewpoint"]',      # 展望台
        'node["natural"="peak"]',          # 山頂
        'node["waterway"="waterfall"]',     # 滝
        'node["natural"="beach"]',         # ビーチ
        'way["natural"="beach"]',
        'node["leisure"="park"]'           # 公園
    ],
    "⛩️ 歴史・神社仏閣": [
        'node["historic"~"castle|ruins|memorial|monument"]', # 城・遺跡・記念碑
        'way["historic"~"castle|ruins"]',
        'node["amenity"="place_of_worship"]', # 神社・寺院・教会
        'way["amenity"="place_of_worship"]',
        'node["historic"="wayside_shrine"]'   # 道端の祠（マニアック）
    ],
    "🎨 芸術・博物館": [
        'node["tourism"="museum"]',        # 博物館・美術館
        'node["tourism"="artwork"]',       # アート作品・像
        'node["tourism"="gallery"]',
        'way["tourism"="museum"]'
    ],
    "♨️ 温泉・リラックス": [
        'node["amenity"="public_bath"]',   # 銭湯・温泉
        'node["natural"="hot_spring"]',    # 源泉
        'node["tourism"="hotel"]'          # 宿泊（主要なもの）
    ],
    "🎡 エンタメ・体験": [
        'node["tourism"="theme_park"]',
        'node["tourism"="zoo"]',
        'node["tourism"="aquarium"]',
        'node["leisure"="resort"]'
    ]
}

def get_specialized_spots(bbox, selected_categories):
    if not selected_categories:
        return []

    query_parts = ""
    for category in selected_categories:
        if category in TOURISM_FILTERS:
            for q in TOURISM_FILTERS[category]:
                query_parts += f'{q}({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});\n'

    # 観光地の名前(name)があるものだけに限定してノイズを減らす
    # Main instance is 504ing, switching to Kumi Systems mirror
    overpass_url = "https://overpass.kumi.systems/api/interpreter"
    overpass_query = f"""
    [out:json][timeout:60];
    (
      {query_parts}
    );
    // 名前があるものだけ抽出
    (._; >;);
    out center body;
    """
    
    try:
        headers = {'User-Agent': 'DeepTourismMapApp/1.0'}
        response = requests.get(overpass_url, params={'data': overpass_query}, headers=headers)
        
        # ステータスコードのチェック
        if response.status_code != 200:
            st.error(f"APIエラー: Status Code {response.status_code}")
            st.text(response.text[:500])  # エラー内容の一部を表示
            return []

        try:
            data = response.json()
            return data.get('elements', [])
        except ValueError:
            st.error("データの読み込みに失敗しました（JSON形式ではありません）。")
            st.text(response.text[:500])  # レスポンス内容の一部を表示
            return []
            
    except Exception as e:
        st.error(f"予期せぬエラー: {e}")
        return []

def main():
    st.set_page_config(layout="wide", page_title="Deep観光マップ")
    
    # CSSで見た目を少しリッチに
    st.markdown("""
    <style>
    .spot-card {
        background-color: #f0f2f6;
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 10px;
        border-left: 5px solid #ff4b4b;
    }
    .spot-title {
        font-weight: bold;
        font-size: 1.1em;
    }
    .spot-tag {
        font-size: 0.8em;
        color: #666;
        background: #fff;
        padding: 2px 6px;
        border-radius: 4px;
        margin-right: 5px;
    }
    </style>
    """, unsafe_allow_html=True)

    # --- サイドバー ---
    st.sidebar.header("🗾 観光スポット探索")
    
    # 地方選択機能
    selected_region = st.sidebar.selectbox(
        "📍 地方を選択 (初期位置)",
        options=list(REGIONS.keys()),
        index=0 # デフォルトは京都(今いる場所)
    )
    
    st.sidebar.caption("地図を四角で囲むと、そのエリアのディープな観光地を抽出します。")
    
    selected_cats = st.sidebar.multiselect(
        "カテゴリ選択",
        options=list(TOURISM_FILTERS.keys()),
        default=["📸 絶景・自然", "⛩️ 歴史・神社仏閣", "🎨 芸術・博物館"]
    )

    # --- メインエリア ---
    col1, col2 = st.columns([3, 2])

    with col1:
        st.subheader("📍 エリア指定")
        
        # 選択された地方の座標を取得
        lat, lon, zoom = REGIONS[selected_region]
        
        # マップの初期位置を更新
        m = folium.Map(location=[lat, lon], zoom_start=zoom)
        
        draw = Draw(
            export=False,
            position='topleft',
            draw_options={
                'polyline': False,
                'circle': False,
                'marker': False,
                'circlemarker': False,
                'rectangle': True, # 四角形のみ許可（使いやすくするため）
                'polygon': True,
            }
        )
        draw.add_to(m)
        output = st_folium(m, height=700, use_container_width=True)

    with col2:
        st.subheader("🔎 探索結果")
        
        if output['last_active_drawing']:
            if not selected_cats:
                st.warning("カテゴリを選択してください。")
            else:
                geometry = output['last_active_drawing']['geometry']
                coords = geometry['coordinates'][0]
                lons = [p[0] for p in coords]
                lats = [p[1] for p in coords]
                bbox = [min(lats), min(lons), max(lats), max(lons)]

                with st.spinner("ディープなスポットを収集中..."):
                    raw_spots = get_specialized_spots(bbox, selected_cats)
                    
                    # データの重複排除と整理
                    seen_names = set()
                    unique_spots = []
                    
                    # 絞り込み機能の追加
                    st.write("---")
                    st.subheader("🔍 結果の絞り込み")
                    col_search, col_filter = st.columns([1, 1])
                    with col_search:
                         search_query = st.text_input("名前で検索", placeholder="例: 神社, 公園...")
                    with col_filter:
                         st.caption("条件指定")
                         filter_website = st.checkbox("公式HPあり (website)")
                         filter_wiki = st.checkbox("Wikiあり (wikipedia)")
                         filter_hours = st.checkbox("営業時間情報あり")

                    filtered_count = 0 
                    
                    for spot in raw_spots:
                        tags = spot.get('tags', {})
                        name = tags.get('name')
                        
                        # 名前がない、または既にリストにある場合はスキップ
                        if not name or name in seen_names:
                            continue

                        # -----------------------
                        # フィルタリングロジック
                        # -----------------------
                        # 1. キーワード検索
                        if search_query and (search_query not in name):
                            continue
                        
                        # 2. 属性フィルタ
                        if filter_website and 'website' not in tags:
                            continue
                        if filter_wiki and 'wikipedia' not in tags:
                            continue
                        if filter_hours and 'opening_hours' not in tags:
                            continue

                        seen_names.add(name)
                        unique_spots.append(spot)

                if unique_spots:
                    st.success(f"**{len(unique_spots)}** 箇所のスポットを発見！")
                    
                    # リスト表示エリア
                    with st.container(height=650):
                        for spot in unique_spots:
                            tags = spot.get('tags', {})
                            name = tags.get('name')
                            
                            # Google検索用URL生成
                            query_name = urllib.parse.quote(f"{name} 観光")
                            google_maps_url = f"https://www.google.com/maps/search/?api=1&query={query_name}"
                            
                            # 詳細情報の抽出
                            details = []
                            if 'wikipedia' in tags: details.append("📖 Wikiあり")
                            if 'website' in tags: details.append("🔗 公式HPあり")
                            if 'opening_hours' in tags: details.append("🕒 営業時間情報あり")
                            
                            # サブカテゴリの特定
                            subtype = "スポット"
                            if 'amenity' in tags: subtype = tags['amenity']
                            elif 'historic' in tags: subtype = tags['historic']
                            elif 'tourism' in tags: subtype = tags['tourism']
                            elif 'natural' in tags: subtype = tags['natural']

                            # カード表示
                            st.markdown(f"""
                            <div class="spot-card">
                                <div class="spot-title">{name}</div>
                                <div style="margin: 5px 0;">
                                    <span class="spot-tag">{subtype}</span>
                                    <span style="font-size:0.8em; color:#888;">{' '.join(details)}</span>
                                </div>
                                <div style="margin-top: 8px;">
                                    <a href="{google_maps_url}" target="_blank" style="text-decoration:none; background-color:#4285F4; color:white; padding:5px 10px; border-radius:5px; font-size:0.9em;">
                                        🌏 Googleマップで評判を見る
                                    </a>
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                else:
                    st.info("この範囲には指定カテゴリのスポットが見つかりませんでした。")
        else:
            st.info("👈 地図上の黒い四角形アイコンをクリックして、範囲を囲んでください。")

if __name__ == "__main__":
    main()