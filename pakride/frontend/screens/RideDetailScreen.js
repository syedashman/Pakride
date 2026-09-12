import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { getSocket } from '../socket';

export default function RideDetailScreen({ route }) {
  const { ride } = route.params;
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [currentUser, setCurrentUser] = useState(null);
  const scrollRef = useRef(null);

  const driverPhone = ride.users?.phone || '';

  useEffect(() => { loadUser(); }, []);

  async function loadUser() {
    const u = await AsyncStorage.getItem('user');
    if (u) {
      const parsed = JSON.parse(u);
      setCurrentUser(parsed);
      const socket = getSocket();
      if (socket) {
        socket.emit('get_messages', ride.id);
        socket.on('chat_history', (history) => setMessages(history));
        socket.on('message_received', (msg) => {
          if (msg.rideId === ride.id) {
            setMessages(prev => {
              const exists = prev.find(m => m.id === msg.id);
              return exists ? prev : [...prev, msg];
            });
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
          }
        });
      }
    }
  }

  async function handleBook() {
    setBooking(true);
    try {
      await api.post(`/rides/${ride.id}/book`);
      setBooked(true);
      Alert.alert('Booking Confirmed! 🎉', 'Your ride has been booked successfully.');
      const socket = getSocket();
      if (socket && currentUser) {
        socket.emit('ride_booked', {
          driverId: ride.driver_id,
          riderName: currentUser.name,
          rideId: ride.id,
          pickup: ride.pickup_address,
          drop: ride.drop_address
        });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not book ride');
    } finally {
      setBooking(false);
    }
  }

  async function handleRate(score) {
    setRating(score);
    try {
      await api.post(`/rides/${ride.id}/rate`, { score, ratee_id: ride.driver_id, comment: '' });
      setRated(true);
      Alert.alert('Thank you! ⭐', 'Your rating has been submitted.');
    } catch (err) {
      Alert.alert('Error', 'Could not submit rating');
    }
  }

  function handleCall() {
    if (!driverPhone) return Alert.alert('Error', 'Driver phone number is not available');
    const phoneNum = driverPhone.replace(/[-\s]/g, '');
    Linking.openURL(`tel:${phoneNum}`).catch(() => Alert.alert('Error', 'Unable to make a call'));
  }

  function handleWhatsApp() {
    if (!driverPhone) return Alert.alert('Error', 'Driver phone number is not available');
    const phoneNum = driverPhone.replace(/[-\s+]/g, '');
    const formatted = phoneNum.startsWith('0') ? '92' + phoneNum.slice(1) : phoneNum;
    const msg = encodeURIComponent(`Hello! I have booked your ride on PakRide from ${ride.pickup_address} to ${ride.drop_address}.`);
    Linking.openURL(`whatsapp://send?phone=${formatted}&text=${msg}`).catch(() =>
      Alert.alert('WhatsApp Not Found', 'Please make sure WhatsApp is installed.')
    );
  }

  function sendMessage() {
    if (!newMsg.trim() || !currentUser) return;
    const socket = getSocket();
    if (!socket) return Alert.alert('Error', 'No connection available');
    const receiverId = currentUser.id === ride.driver_id ? ride.rider_id : ride.driver_id;
    socket.emit('send_message', {
      rideId: ride.id,
      senderId: currentUser.id,
      receiverId,
      senderName: currentUser.name,
      text: newMsg.trim()
    });
    setNewMsg('');
  }

  const matchColor = ride.match_score > 80 ? '#4caf50' : ride.match_score > 60 ? '#ff9800' : '#f44336';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>

        <View style={styles.topBar}>
          <View style={styles.driverMini}>
            <View style={styles.miniAvatar}>
              <Text style={styles.miniAvatarTxt}>{ride.users?.name?.[0] || 'D'}</Text>
            </View>
            <View>
              <Text style={styles.miniName}>{ride.users?.name || 'Driver'}</Text>
              <Text style={styles.miniPhone}>{driverPhone}</Text>
            </View>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Text style={styles.callIcon}>📞</Text>
              <Text style={styles.callTxt}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.waBtn} onPress={handleWhatsApp}>
              <Text style={styles.callIcon}>💬</Text>
              <Text style={styles.waTxt}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tab, activeTab === 'details' && styles.tabActive]} onPress={() => setActiveTab('details')}>
            <Text style={[styles.tabTxt, activeTab === 'details' && styles.tabTxtActive]}>Ride Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'chat' && styles.tabActive]} onPress={() => setActiveTab('chat')}>
            <Text style={[styles.tabTxt, activeTab === 'chat' && styles.tabTxtActive]}>
              💬 Message {messages.length > 0 ? `(${messages.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'details' ? (
          <ScrollView style={styles.scroll}>
            <View style={styles.matchBanner}>
              <Text style={styles.matchLabel}>AI Match Score</Text>
              <Text style={[styles.matchScore, { color: matchColor }]}>{ride.match_score || 0}%</Text>
              <Text style={styles.matchSub}>Route similarity</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Route</Text>
              <View style={styles.routeRow}>
                <View style={styles.routeDot} />
                <Text style={styles.routeText}>{ride.pickup_address || 'Pickup'}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: '#f44336' }]} />
                <Text style={styles.routeText}>{ride.drop_address || 'Drop'}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Details</Text>
              {[
                ['💺 Seats Available', ride.seats_available],
                ['💰 Cost per person', `₨${ride.cost_pkr || 0}`],
                ['🕐 Departure', ride.departure_time ? new Date(ride.departure_time).toLocaleString() : 'Flexible'],
                ['📊 Status', ride.status],
              ].map(([label, val]) => (
                <View key={label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{label}</Text>
                  <Text style={styles.detailVal}>{val}</Text>
                </View>
              ))}
            </View>

            {!booked ? (
              <TouchableOpacity style={styles.bookBtn} onPress={handleBook} disabled={booking}>
                {booking ? <ActivityIndicator color="#1a1a2e" /> : <Text style={styles.bookTxt}>🎟  Confirm Booking</Text>}
              </TouchableOpacity>
            ) : (
              <View style={styles.bookedBox}>
                <Text style={styles.bookedTxt}>✅ Ride Booked!</Text>
                {!rated ? (
                  <View>
                    <Text style={styles.rateLabel}>Rate your driver:</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <TouchableOpacity key={s} onPress={() => handleRate(s)}>
                          <Text style={[styles.star, { color: s <= rating ? '#FFD700' : '#555' }]}>★</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.ratedTxt}>⭐ Rating submitted successfully!</Text>
                )}
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        ) : (
          <View style={styles.chatContainer}>
            <ScrollView
              ref={scrollRef}
              style={styles.chatMessages}
              contentContainerStyle={{ padding: 12 }}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
              {messages.length === 0 && (
                <Text style={styles.noChat}>No messages yet — send the first one! 👋</Text>
              )}
              {messages.map(msg => (
                <View key={msg.id} style={[styles.msgRow, msg.senderId === currentUser?.id && styles.msgRowMe]}>
                  {msg.senderId !== currentUser?.id && (
                    <View style={styles.msgAvatar}>
                      <Text style={styles.msgAvatarTxt}>{msg.senderName?.[0] || 'D'}</Text>
                    </View>
                  )}
                  <View style={[styles.msgBubble, msg.senderId === currentUser?.id && styles.msgBubbleMe]}>
                    <Text style={styles.msgText}>{msg.text}</Text>
                    <Text style={styles.msgTime}>{msg.time}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.msgInput}
                placeholder="Type a message..."
                placeholderTextColor="#555"
                value={newMsg}
                onChangeText={setNewMsg}
                multiline
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                <Text style={styles.sendTxt}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#16213e', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 50 },
  driverMini: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4fc3f7', justifyContent: 'center', alignItems: 'center' },
  miniAvatarTxt: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
  miniName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  miniPhone: { color: '#888', fontSize: 12 },
  topActions: { flexDirection: 'row', gap: 10 },
  callBtn: { backgroundColor: '#4caf5022', borderRadius: 10, padding: 10, alignItems: 'center', minWidth: 60 },
  waBtn: { backgroundColor: '#25D36622', borderRadius: 10, padding: 10, alignItems: 'center', minWidth: 60 },
  callIcon: { fontSize: 20 },
  callTxt: { color: '#4caf50', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  waTxt: { color: '#25D366', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  tabRow: { flexDirection: 'row', backgroundColor: '#16213e', borderBottomWidth: 1, borderBottomColor: '#0f3460' },
  tab: { flex: 1, padding: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#4fc3f7' },
  tabTxt: { color: '#888', fontWeight: '500' },
  tabTxtActive: { color: '#4fc3f7', fontWeight: 'bold' },
  scroll: { flex: 1 },
  matchBanner: { backgroundColor: '#16213e', padding: 20, alignItems: 'center' },
  matchLabel: { color: '#888', fontSize: 13 },
  matchScore: { fontSize: 48, fontWeight: 'bold' },
  matchSub: { color: '#888', fontSize: 13, marginTop: 2 },
  card: { backgroundColor: '#16213e', borderRadius: 16, padding: 18, marginHorizontal: 16, marginTop: 12 },
  sectionTitle: { color: '#4fc3f7', fontWeight: 'bold', fontSize: 14, marginBottom: 14 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4caf50' },
  routeLine: { width: 2, height: 20, backgroundColor: '#444', marginLeft: 5, marginVertical: 4 },
  routeText: { color: '#fff', fontSize: 15 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#0f3460' },
  detailLabel: { color: '#aaa', fontSize: 14 },
  detailVal: { color: '#fff', fontSize: 14, fontWeight: '500' },
  bookBtn: { backgroundColor: '#4fc3f7', borderRadius: 14, padding: 18, alignItems: 'center', marginHorizontal: 16, marginTop: 16 },
  bookTxt: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
  bookedBox: { backgroundColor: '#4caf5022', borderRadius: 14, padding: 20, marginHorizontal: 16, marginTop: 16, alignItems: 'center' },
  bookedTxt: { color: '#4caf50', fontWeight: 'bold', fontSize: 18, marginBottom: 16 },
  rateLabel: { color: '#aaa', textAlign: 'center', marginBottom: 10 },
  starsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  star: { fontSize: 36 },
  ratedTxt: { color: '#FFD700', fontWeight: 'bold', fontSize: 15 },
  chatContainer: { flex: 1 },
  chatMessages: { flex: 1, backgroundColor: '#1a1a2e' },
  noChat: { color: '#555', textAlign: 'center', marginTop: 40, fontSize: 14 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#4fc3f7', justifyContent: 'center', alignItems: 'center' },
  msgAvatarTxt: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 12 },
  msgBubble: { backgroundColor: '#16213e', borderRadius: 16, borderBottomLeftRadius: 4, padding: 12, maxWidth: '75%' },
  msgBubbleMe: { backgroundColor: '#4fc3f7', borderBottomLeftRadius: 16, borderBottomRightRadius: 4 },
  msgText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  msgTime: { color: '#ffffff66', fontSize: 10, marginTop: 4, textAlign: 'right' },
  inputRow: { flexDirection: 'row', padding: 12, backgroundColor: '#16213e', gap: 10, alignItems: 'flex-end' },
  msgInput: { flex: 1, backgroundColor: '#0f3460', color: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn: { backgroundColor: '#4fc3f7', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendTxt: { color: '#1a1a2e', fontSize: 18, fontWeight: 'bold' },
});