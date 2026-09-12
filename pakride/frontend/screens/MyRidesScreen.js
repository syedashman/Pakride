import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import api from '../api';

export default function MyRidesScreen({ navigation }) {
  const [offered, setOffered] = useState([]);
  const [booked, setBooked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('offered');

  useEffect(() => { loadRides(); }, []);

  async function loadRides() {
    try {
      const res = await api.get('/rides/my-rides');
      setOffered(res.data.offered || []);
      setBooked(res.data.booked || []);
    } catch (e) {
      Alert.alert('Error', 'Could not load rides. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function completeRide(rideId) {
    try {
      await api.put(`/rides/${rideId}/complete`);
      Alert.alert('Ride Completed!', 'Your ride has been marked as completed.');
      loadRides();
    } catch (e) {
      Alert.alert('Error', 'Could not complete ride');
    }
  }

  function openMessages(ride, otherUser) {
    navigation.navigate('Messages', { ride, otherUser });
  }

  const statusColor = {
    open: '#4fc3f7', full: '#ff9800',
    completed: '#4caf50', cancelled: '#f44336', in_progress: '#9c27b0'
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4fc3f7" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'offered' && styles.tabActive]} onPress={() => setTab('offered')}>
          <Text style={[styles.tabTxt, tab === 'offered' && styles.tabTxtActive]}>🚗 Offered ({offered.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'booked' && styles.tabActive]} onPress={() => setTab('booked')}>
          <Text style={[styles.tabTxt, tab === 'booked' && styles.tabTxtActive]}>🎟 Booked ({booked.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list}>
        {tab === 'offered' && (offered.length === 0 ? (
          <Text style={styles.empty}>You have not offered any rides yet.{'\n'}Go to the "Offer Ride" tab to get started!</Text>
        ) : offered.map(r => (
          <View key={r.id} style={styles.rideCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.route}>{r.pickup_address} → {r.drop_address}</Text>
              <View style={[styles.badge, { backgroundColor: (statusColor[r.status] || '#888') + '33' }]}>
                <Text style={[styles.badgeTxt, { color: statusColor[r.status] || '#888' }]}>{r.status}</Text>
              </View>
            </View>
            <Text style={styles.meta}>💺 {r.seats_available} seats left  •  ₨{r.cost_pkr}/person</Text>
            <Text style={styles.meta}>🕐 {r.departure_time ? new Date(r.departure_time).toLocaleTimeString() : 'Flexible'}</Text>

            <View style={styles.actionRow}>
              {r.status === 'open' && (
                <TouchableOpacity style={styles.completeBtn} onPress={() => completeRide(r.id)}>
                  <Text style={styles.completeTxt}>✅ Mark Complete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.msgBtn} onPress={() => openMessages(r, { id: r.last_rider_id, name: 'Rider', phone: r.rider_phone })}>
                <Text style={styles.msgBtnTxt}>💬 Messages</Text>
              </TouchableOpacity>
            </View>
          </View>
        )))}

        {tab === 'booked' && (booked.length === 0 ? (
          <Text style={styles.empty}>You have not booked any rides yet.{'\n'}Go to the "Find Ride" tab to get started!</Text>
        ) : booked.map(b => (
          <View key={b.id} style={styles.rideCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.route}>{b.rides?.pickup_address} → {b.rides?.drop_address}</Text>
              <View style={[styles.badge, { backgroundColor: '#4fc3f744' }]}>
                <Text style={[styles.badgeTxt, { color: '#4fc3f7' }]}>{b.status}</Text>
              </View>
            </View>
            <Text style={styles.meta}>💰 Cost: ₨{b.rides?.cost_pkr || 0}</Text>
            <Text style={styles.meta}>📅 {b.created_at ? new Date(b.created_at).toLocaleDateString() : ''}</Text>

            <TouchableOpacity style={styles.msgBtn} onPress={() => openMessages(
              { ...b.rides, id: b.ride_id },
              { id: b.rides?.driver_id, name: 'Driver', phone: b.rides?.driver_phone }
            )}>
              <Text style={styles.msgBtnTxt}>💬 Message Driver</Text>
            </TouchableOpacity>
          </View>
        )))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  tabRow: { flexDirection: 'row', padding: 16, gap: 10 },
  tab: { flex: 1, padding: 12, backgroundColor: '#16213e', borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#4fc3f7' },
  tabTxt: { color: '#888', fontWeight: 'bold', fontSize: 13 },
  tabTxtActive: { color: '#1a1a2e' },
  list: { paddingHorizontal: 16 },
  empty: { color: '#888', textAlign: 'center', marginTop: 60, fontSize: 15, lineHeight: 26 },
  rideCard: { backgroundColor: '#16213e', borderRadius: 14, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  route: { color: '#fff', fontWeight: 'bold', flex: 1, marginRight: 8, fontSize: 14 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { fontSize: 11, fontWeight: 'bold' },
  meta: { color: '#aaa', fontSize: 13, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  completeBtn: { flex: 1, padding: 10, backgroundColor: '#4caf5022', borderRadius: 8, alignItems: 'center' },
  completeTxt: { color: '#4caf50', fontWeight: 'bold', fontSize: 13 },
  msgBtn: { flex: 1, padding: 10, backgroundColor: '#4fc3f722', borderRadius: 8, alignItems: 'center' },
  msgBtnTxt: { color: '#4fc3f7', fontWeight: 'bold', fontSize: 13 },
});