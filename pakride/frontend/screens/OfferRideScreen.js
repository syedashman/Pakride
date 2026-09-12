import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import api from '../api';
import MapPicker from '../components/MapPicker';

export default function OfferRideScreen() {
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [seats, setSeats] = useState('3');
  const [cost, setCost] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleOffer() {
    if (!pickup || !drop) return Alert.alert('Error', 'Please select pickup and drop locations');
    if (!seats || isNaN(seats)) return Alert.alert('Error', 'Please enter a valid number of seats');
    setLoading(true);
    try {
      await api.post('/rides/offer', {
        pickup_address: pickup.name,
        drop_address: drop.name,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        seats_available: parseInt(seats),
        cost_pkr: parseInt(cost) || 0,
        departure_time: time || new Date().toISOString(),
      });
      Alert.alert('Ride Posted! 🎉', 'Your ride has been posted successfully. Riders will find you shortly.');
      setPickup(null); setDrop(null); setSeats('3'); setCost(''); setTime('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not post ride');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Route Details</Text>

       <MapPicker
  pickup={pickup}
  drop={drop}
  onPickupSelect={setPickup}
  onDropSelect={setDrop}
/>

        <Text style={styles.sectionLabel}>Ride Details</Text>

        <Text style={styles.label}>Available Seats</Text>
        <View style={styles.seatRow}>
          {['1', '2', '3', '4'].map(n => (
            <TouchableOpacity key={n} style={[styles.seatBtn, seats === n && styles.seatBtnActive]} onPress={() => setSeats(n)}>
              <Text style={[styles.seatTxt, seats === n && styles.seatTxtActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Cost per Person (PKR)</Text>
        <TextInput style={styles.input} placeholder="e.g. 150" placeholderTextColor="#555" value={cost} onChangeText={setCost} keyboardType="numeric" />

        <Text style={styles.label}>Departure Time</Text>
        <TextInput style={styles.input} placeholder="e.g. 8:30 AM" placeholderTextColor="#555" value={time} onChangeText={setTime} />

        <TouchableOpacity style={styles.submitBtn} onPress={handleOffer} disabled={loading}>
          {loading ? <ActivityIndicator color="#1a1a2e" /> : <Text style={styles.submitTxt}>🚗  Post Ride</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Tips for a great ride</Text>
        <Text style={styles.tipText}>• Set a fair price to attract more riders{'\n'}• Keep your departure time accurate{'\n'}• Maintain a good rating for more bookings</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  card: { backgroundColor: '#16213e', borderRadius: 16, padding: 18, marginBottom: 16 },
  sectionLabel: { color: '#4fc3f7', fontWeight: 'bold', fontSize: 14, marginTop: 8, marginBottom: 12 },
  label: { color: '#aaa', fontSize: 13, marginBottom: 6, marginTop: 12 },
  seatRow: { flexDirection: 'row', gap: 10 },
  seatBtn: { flex: 1, padding: 14, backgroundColor: '#0f3460', borderRadius: 10, alignItems: 'center' },
  seatBtnActive: { backgroundColor: '#4fc3f7' },
  seatTxt: { color: '#aaa', fontWeight: 'bold', fontSize: 16 },
  seatTxtActive: { color: '#1a1a2e' },
  input: { backgroundColor: '#0f3460', color: '#fff', borderRadius: 10, padding: 14, fontSize: 15 },
  submitBtn: { backgroundColor: '#4fc3f7', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 24 },
  submitTxt: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
  tipCard: { backgroundColor: '#16213e', borderRadius: 14, padding: 16, marginBottom: 40 },
  tipTitle: { color: '#4fc3f7', fontWeight: 'bold', marginBottom: 8 },
  tipText: { color: '#ccc', fontSize: 13, lineHeight: 22 },
});