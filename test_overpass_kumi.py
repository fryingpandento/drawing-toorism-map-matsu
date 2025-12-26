import requests

# Trying Kumi Systems mirror
url = "https://overpass.kumi.systems/api/interpreter"
query = """
[out:json][timeout:60];
node(34.98, 135.75, 34.99, 135.76)["tourism"="viewpoint"];
out center;
"""

try:
    print(f"Sending request to {url}...")
    headers = {'User-Agent': 'PythonOverpassClient/1.0'} # Kumi systems often requires User-Agent
    response = requests.get(url, params={'data': query}, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("JSON parsing successful. API is working.")
        print(f"Elements found: {len(data.get('elements', []))}")
    else:
        print(f"Error Response text start: {response.text[:200]}")
except Exception as e:
    print(f"Request failed: {e}")
