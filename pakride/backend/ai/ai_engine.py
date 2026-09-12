from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import math

app = Flask(__name__)
CORS(app)

def haversine(lat1, lng1, lat2, lng2):
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def calculate_route_overlap(rider, ride):
    pickup_dist = haversine(rider['pickup_lat'], rider['pickup_lng'],
                            ride['pickup_lat'], ride['pickup_lng'])
    drop_dist = haversine(rider['drop_lat'], rider['drop_lng'],
                          ride['drop_lat'], ride['drop_lng'])
    rider_route_len = haversine(rider['pickup_lat'], rider['pickup_lng'],
                                rider['drop_lat'], rider['drop_lng'])
    detour = pickup_dist + drop_dist
    detour_pct = detour / max(rider_route_len, 0.1)
    overlap_score = max(0, 100 - detour_pct * 80)
    return round(overlap_score, 1), round(detour, 2)

@app.route('/', methods=['GET'])
def home():
    return jsonify({'message': 'PakRide AI Engine is running!', 'version': '1.0.0'})

@app.route('/match', methods=['POST'])
def match_rides():
    data = request.json
    rider = data.get('rider')
    rides = data.get('rides', [])

    if not rider or not rides:
        return jsonify({'matches': []})

    scored = []
    for ride in rides:
        try:
            score, detour = calculate_route_overlap(rider, ride)
            if score > 35:
                ride_copy = dict(ride)
                ride_copy['match_score'] = score
                ride_copy['detour_km'] = detour
                scored.append(ride_copy)
        except Exception:
            continue

    if len(scored) >= 3:
        try:
            features = []
            for r in scored:
                features.append([
                    r['pickup_lat'], r['pickup_lng'],
                    r['drop_lat'], r['drop_lng'],
                    r['match_score']
                ])

            scaler = StandardScaler()
            X = scaler.fit_transform(features)
            n_clusters = min(3, len(scored))
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X)

            rider_vec = scaler.transform([[
                rider['pickup_lat'], rider['pickup_lng'],
                rider['drop_lat'], rider['drop_lng'],
                100
            ]])
            rider_cluster = kmeans.predict(rider_vec)[0]

            best_cluster = [r for r, l in zip(scored, labels) if l == rider_cluster]
            other = [r for r, l in zip(scored, labels) if l != rider_cluster]
            reranked = best_cluster + other

        except Exception:
            reranked = scored
    else:
        reranked = scored

    reranked.sort(key=lambda x: x['match_score'], reverse=True)
    top5 = reranked[:5]

    return jsonify({'matches': top5, 'total_found': len(scored)})

@app.route('/estimate-cost', methods=['POST'])
def estimate_cost():
    data = request.json
    pickup_lat = data.get('pickup_lat')
    pickup_lng = data.get('pickup_lng')
    drop_lat = data.get('drop_lat')
    drop_lng = data.get('drop_lng')
    seats = data.get('seats', 3)

    distance = haversine(pickup_lat, pickup_lng, drop_lat, drop_lng)
    petrol_price_per_liter = 280
    avg_km_per_liter = 12
    cost_per_km = petrol_price_per_liter / avg_km_per_liter
    total_cost = distance * cost_per_km
    per_person = total_cost / max(seats, 1)

    return jsonify({
        'distance_km': round(distance, 1),
        'total_cost_pkr': round(total_cost),
        'per_person_pkr': round(per_person),
        'savings_pkr': round(total_cost - per_person)
    })

@app.route('/generate-demo-data', methods=['GET'])
def generate_demo():
    karachi_routes = [
        {'name': 'DHA to Saddar', 'p_lat': 24.8219, 'p_lng': 67.0451, 'd_lat': 24.8608, 'd_lng': 67.0104},
        {'name': 'Gulshan to I.I.Chundrigar', 'p_lat': 24.9243, 'p_lng': 67.0930, 'd_lat': 24.8608, 'd_lng': 67.0104},
        {'name': 'North Karachi to Clifton', 'p_lat': 24.9831, 'p_lng': 67.0608, 'd_lat': 24.8120, 'd_lng': 67.0323},
        {'name': 'Korangi to PECHS', 'p_lat': 24.8271, 'p_lng': 67.1357, 'd_lat': 24.8793, 'd_lng': 67.0645},
        {'name': 'Malir to University Road', 'p_lat': 24.8815, 'p_lng': 67.1925, 'd_lat': 24.9243, 'd_lng': 67.0930},
    ]
    return jsonify({'sample_routes': karachi_routes, 'message': 'Use these for testing'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
