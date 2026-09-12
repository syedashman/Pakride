import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import api from '../api';

// Conditionally import the correct map picker
const MapPicker = Platform.OS === 'web' 
  ? require('../components/MapPickerWeb').default 
  : require('../components/MapPicker').default;

export default function FindRideScreen({ navigation }) {
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  async function findRides() {
    if (!pickup || !drop) return Alert.alert('Error', 'Please select pickup and drop locations');
    setLoading(true);
    try {
      const res = await api.post('/match/find', {
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
      });
      setMatches(res.data.matches || []);
      if ((res.data.matches || []).length === 0) Alert.alert('No Matches Found', 'No rides available for this route. Please try again later.');
    } catch (err) {
      Alert.alert('Connection Error', 'Could not connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchBox}>
        <MapPicker
  pickup={pickup}
  drop={drop}
  onPickupSelect={setPickup}
  onDropSelect={setDrop}
/>

        <TouchableOpacity style={styles.searchBtn} onPress={findRides} disabled={loading}>
          {loading ? <ActivityIndicator color="#1a1a2e" /> : <Text style={styles.searchBtnTxt}>🔍  Find with AI</Text>}
        </TouchableOpacity>
      </View>

      {matches.length > 0 && (
        <View>
          <Text style={styles.resultTitle}>✅ {matches.length} ride{matches.length > 1 ? 's' : ''} found</Text>
          {matches.map((ride, i) => (
            <TouchableOpacity key={ride.id || i} style={styles.rideCard} onPress={() => navigation.navigate('RideDetail', { ride })}>
              <View style={styles.rideHeader}>
                <Text style={styles.driverName}>🚗 {ride.users?.name || 'Driver'}</Text>
                <View style={[styles.scoreBadge, { backgroundColor: ride.match_score > 80 ? '#4caf50' : ride.match_score > 60 ? '#ff9800' : '#f44336' }]}>
                  <Text style={styles.scoreText}>{ride.match_score}% match</Text>
                </View>
              </View>
              <Text style={styles.rideRoute}>📍 {ride.pickup_address || 'Pickup'}</Text>
              <Text style={styles.rideRoute}>🏁 {ride.drop_address || 'Drop'}</Text>
              <View style={styles.rideFooter}>
                <Text style={styles.rideMeta}>⭐ {ride.users?.rating || '5.0'}</Text>
                <Text style={styles.rideMeta}>💺 {ride.seats_available} seats</Text>
                <Text style={styles.ridePrice}>₨{ride.cost_pkr || 0}/person</Text>
              </View>
              {ride.detour_km !== undefined && (
                <Text style={styles.detour}>Additional detour: {ride.detour_km} km</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  searchBox: { backgroundColor: '#16213e', borderRadius: 16, padding: 18, marginBottom: 20 },
  searchBtn: { backgroundColor: '#4fc3f7', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 12 },
  searchBtnTxt: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 15 },
  resultTitle: { color: '#4fc3f7', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  rideCard: { backgroundColor: '#16213e', borderRadius: 14, padding: 16, marginBottom: 12 },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  driverName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  scoreBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  scoreText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  rideRoute: { color: '#ccc', fontSize: 14, marginBottom: 4 },
  rideFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#0f3460' },
  rideMeta: { color: '#aaa', fontSize: 13 },
  ridePrice: { color: '#4fc3f7', fontWeight: 'bold', fontSize: 13 },
  detour: { color: '#888', fontSize: 12, marginTop: 6 },
});