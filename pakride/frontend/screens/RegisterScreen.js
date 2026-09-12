import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

export default function RegisterScreen({ navigation, onLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'rider' });
  const [loading, setLoading] = useState(false);

  function update(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleRegister() {
    if (!form.name || !form.email || !form.password || !form.phone) {
      return Alert.alert('Error', 'All fields are required');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      if (onLogin) onLogin();
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.logo}>🚗 PakRide</Text>
      <Text style={styles.tagline}>Create your account</Text>
      <View style={styles.form}>
        {[['Full Name', 'name', 'Ali Hassan', false], ['Email', 'email', 'ali@example.com', false], ['Password', 'password', '••••••••', true], ['Phone', 'phone', '0300-1234567', false]].map(([label, key, ph, secure]) => (
          <View key={key}>
            <Text style={styles.label}>{label}</Text>
            <TextInput style={styles.input} placeholder={ph} placeholderTextColor="#555" value={form[key]} onChangeText={v => update(key, v)} secureTextEntry={secure} autoCapitalize="none" keyboardType={key === 'phone' ? 'phone-pad' : key === 'email' ? 'email-address' : 'default'} />
          </View>
        ))}
        <Text style={styles.label}>I want to</Text>
        <View style={styles.roleRow}>
          {['rider', 'driver', 'both'].map(r => (
            <TouchableOpacity key={r} style={[styles.roleBtn, form.role === r && styles.roleBtnActive]} onPress={() => update('role', r)}>
              <Text style={[styles.roleTxt, form.role === r && styles.roleTxtActive]}>
                {r === 'rider' ? '🙋 Rider' : r === 'driver' ? '🚗 Driver' : '🔄 Both'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#1a1a2e" /> : <Text style={styles.btnText}>Create Account</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  inner: { padding: 28, paddingTop: 60 },
  logo: { fontSize: 42, textAlign: 'center', marginBottom: 6 },
  tagline: { color: '#4fc3f7', textAlign: 'center', fontSize: 16, marginBottom: 30 },
  form: { backgroundColor: '#16213e', borderRadius: 16, padding: 20 },
  label: { color: '#aaa', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0f3460', color: '#fff', borderRadius: 10, padding: 14, fontSize: 15 },
  roleRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  roleBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#0f3460', alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#4fc3f7' },
  roleTxt: { color: '#aaa', fontSize: 13 },
  roleTxtActive: { color: '#1a1a2e', fontWeight: 'bold' },
  btn: { backgroundColor: '#4fc3f7', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#4fc3f7', textAlign: 'center', marginTop: 16, fontSize: 14 },
});