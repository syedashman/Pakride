import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

export default function ProfileScreen({ navigation, onLogout }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      const res = await api.get('/users/profile');
      setUser(res.data);
      setName(res.data.name);
      setPhone(res.data.phone || '');
    } catch (e) {
      const stored = await AsyncStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    try {
      await api.put('/users/profile', { name, phone });
      Alert.alert('Saved!', 'Profile update ho gaya');
      setEditing(false);
      loadProfile();
    } catch (e) {
      Alert.alert('Error', 'Could not update profile');
    }
  }

  async function handleLogout() {
    await AsyncStorage.clear();
    if (onLogout) onLogout();
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4fc3f7" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingText}>⭐ {user?.rating || '5.0'}</Text>
          <Text style={styles.roleTag}>{user?.role}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Profile Info</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={styles.editBtn}>{editing ? 'Cancel' : '✏️ Edit'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Full Name</Text>
        {editing ? (
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor="#555" />
        ) : (
          <Text style={styles.value}>{user?.name}</Text>
        )}

        <Text style={styles.label}>Phone</Text>
        {editing ? (
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#555" />
        ) : (
          <Text style={styles.value}>{user?.phone || 'Not set'}</Text>
        )}

        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{user?.role}</Text>

        <Text style={styles.label}>CNIC Verified</Text>
        <Text style={[styles.value, { color: user?.cnic_verified ? '#4caf50' : '#ff9800' }]}>
          {user?.cnic_verified ? '✅ Verified' : '⚠️ Not verified'}
        </Text>

        <Text style={styles.label}>Member since</Text>
        <Text style={styles.value}>{user?.created_at ? new Date(user.created_at).toDateString() : 'N/A'}</Text>

        {editing && (
          <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
            <Text style={styles.saveTxt}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutTxt}>🚪 Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  avatarSection: { alignItems: 'center', paddingTop: 40, paddingBottom: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#4fc3f7', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#1a1a2e' },
  userName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  userEmail: { color: '#888', fontSize: 14, marginTop: 4 },
  ratingRow: { flexDirection: 'row', gap: 12, marginTop: 10, alignItems: 'center' },
  ratingText: { color: '#fff', fontSize: 15 },
  roleTag: { backgroundColor: '#4fc3f722', color: '#4fc3f7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  card: { backgroundColor: '#16213e', borderRadius: 16, padding: 18, marginHorizontal: 16, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  editBtn: { color: '#4fc3f7', fontSize: 14 },
  label: { color: '#888', fontSize: 12, marginTop: 14, marginBottom: 4 },
  value: { color: '#fff', fontSize: 15 },
  input: { backgroundColor: '#0f3460', color: '#fff', borderRadius: 10, padding: 12, fontSize: 15 },
  saveBtn: { backgroundColor: '#4fc3f7', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 20 },
  saveTxt: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 15 },
  logoutBtn: { marginHorizontal: 16, padding: 15, backgroundColor: '#ff6b6b22', borderRadius: 12, alignItems: 'center' },
  logoutTxt: { color: '#ff6b6b', fontWeight: 'bold', fontSize: 15 },
});