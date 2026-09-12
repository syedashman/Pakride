import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { connectSocket } from '../socket';

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const u = await AsyncStorage.getItem('user');
    const parsed = u ? JSON.parse(u) : null;
    if (parsed) {
      setUser(parsed);
      try {
        const socket = connectSocket(parsed.id);
        socketRef.current = socket;
        socket.off('new_notification');
        socket.on('new_notification', (notif) => {
          setNotifications(prev => [notif, ...prev]);
          Alert.alert(notif.title, notif.body);
        });
      } catch (e) {
        console.log('Socket error:', e);
      }
    }
    try {
      const res = await api.get('/users/stats');
      setStats(res.data);
    } catch (e) {
      setStats({ totalRides: 0, totalMoneySavedPKR: 0, totalKmTravelled: 0, co2SavedKg: 0 });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await AsyncStorage.clear();
    navigation.navigate('Login');
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4fc3f7" />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.sub}>Ready to carpool today?</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={{ color: '#ff6b6b', fontSize: 13 }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        {[
          { label: 'Total Rides', value: stats?.totalRides ?? 0, icon: '🚗' },
          { label: 'PKR Saved', value: `₨${stats?.totalMoneySavedPKR ?? 0}`, icon: '💰' },
          { label: 'KM Travelled', value: stats?.totalKmTravelled ?? 0, icon: '📍' },
          { label: 'CO₂ Saved (kg)', value: stats?.co2SavedKg ?? 0, icon: '🌿' },
        ].map(s => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={styles.statVal}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('FindRide')}>
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionTitle}>Find a Ride</Text>
          <Text style={styles.actionSub}>Search for a driver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#0f3460' }]} onPress={() => navigation.navigate('OfferRide')}>
          <Text style={styles.actionIcon}>🚗</Text>
          <Text style={styles.actionTitle}>Offer a Ride</Text>
          <Text style={styles.actionSub}>Share your seat</Text>
        </TouchableOpacity>
      </View>

      {notifications.length > 0 && (
        <View style={styles.notifSection}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          {notifications.map((n, i) => (
            <View key={i} style={styles.notifCard}>
              <Text style={styles.notifTitle}>{n.title}</Text>
              <Text style={styles.notifBody}>{n.body}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🌟 Why PakRide?</Text>
        <Text style={styles.infoText}>• Share fuel costs with fellow commuters{'\n'}• Beat traffic by carpooling{'\n'}• AI-powered best match{'\n'}• Safe and verified drivers</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  greeting: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  sub: { color: '#aaa', fontSize: 14, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  statCard: { width: '47%', backgroundColor: '#16213e', borderRadius: 14, padding: 16, alignItems: 'center' },
  statIcon: { fontSize: 28, marginBottom: 6 },
  statVal: { color: '#4fc3f7', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 2, textAlign: 'center' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 12 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  actionCard: { flex: 1, backgroundColor: '#16213e', borderRadius: 14, padding: 18, alignItems: 'center' },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  actionSub: { color: '#888', fontSize: 12, marginTop: 3 },
  notifSection: { paddingHorizontal: 16, marginBottom: 16 },
  notifCard: { backgroundColor: '#16213e', borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#4fc3f7' },
  notifTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  notifBody: { color: '#aaa', fontSize: 13 },
  infoCard: { margin: 16, backgroundColor: '#16213e', borderRadius: 14, padding: 18, marginBottom: 40 },
  infoTitle: { color: '#4fc3f7', fontWeight: 'bold', fontSize: 15, marginBottom: 10 },
  infoText: { color: '#ccc', fontSize: 14, lineHeight: 24 },
});