import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

export default function LoginScreen({ navigation, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      if (onLogin) onLogin();
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Text style={styles.logo}>🚗 PakRide</Text>
        <Text style={styles.tagline}>Karachi's Smartest Carpool App</Text>
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="ali@example.com" placeholderTextColor="#555" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#555" value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Don't have an account? Register here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  inner: { flex: 1, justifyContent: 'center', padding: 28 },
  logo: { fontSize: 42, textAlign: 'center', marginBottom: 6 },
  tagline: { color: '#4fc3f7', textAlign: 'center', fontSize: 16, marginBottom: 40 },
  form: { backgroundColor: '#16213e', borderRadius: 16, padding: 20 },
  label: { color: '#aaa', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0f3460', color: '#fff', borderRadius: 10, padding: 14, fontSize: 15 },
  btn: { backgroundColor: '#4fc3f7', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#4fc3f7', textAlign: 'center', marginTop: 16, fontSize: 14 },
});