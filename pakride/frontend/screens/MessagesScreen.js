import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket, connectSocket } from '../socket';

export default function MessagesScreen({ route }) {
  const { ride, otherUser } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const scrollRef = useRef(null);
  const currentUserRef = useRef(null);
  const messagesRef = useRef([]);

  useEffect(() => {
    loadUser();
    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('chat_history');
        socket.off('message_received');
      }
    };
  }, []);

  async function loadUser() {
    const u = await AsyncStorage.getItem('user');
    if (u) {
      const parsed = JSON.parse(u);
      setCurrentUser(parsed);
      currentUserRef.current = parsed;
      let socket = getSocket();
      if (!socket || !socket.connected) {
        socket = connectSocket(parsed.id);
        socket.on('connect', () => setupSocket(parsed, socket));
      } else {
        setupSocket(parsed, socket);
      }
    }
  }

  function setupSocket(user, socket) {
    socket.off('chat_history');
    socket.off('message_received');
    socket.emit('get_messages', ride.id);
    socket.on('chat_history', (history) => {
      messagesRef.current = history;
      setMessages([...history]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    });
    socket.on('message_received', (msg) => {
      if (msg.rideId !== ride.id) return;
      const exists = messagesRef.current.find(m => m.id === msg.id);
      if (!exists) {
        messagesRef.current = [...messagesRef.current, msg];
        setMessages([...messagesRef.current]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });
  }

  function sendMessage() {
    if (!newMsg.trim() || !currentUserRef.current) return;
    let socket = getSocket();
    if (!socket || !socket.connected) {
      socket = connectSocket(currentUserRef.current.id);
    }
    socket.emit('send_message', {
      rideId: ride.id,
      senderId: currentUserRef.current.id,
      receiverId: otherUser?.id,
      senderName: currentUserRef.current.name,
      text: newMsg.trim()
    });
    setNewMsg('');
  }

  function handleCall() {
    const phone = otherUser?.phone?.replace(/[-\s]/g, '');
    if (phone) Linking.openURL(`tel:${phone}`);
  }

  function handleWhatsApp() {
    const phone = otherUser?.phone?.replace(/[-\s+]/g, '');
    if (!phone) return;
    const formatted = phone.startsWith('0') ? '92' + phone.slice(1) : phone;
    const msg = encodeURIComponent('Hello! I would like to discuss the ride I booked on PakRide.');
    Linking.openURL(`whatsapp://send?phone=${formatted}&text=${msg}`);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>

        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{otherUser?.name?.[0] || '?'}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{otherUser?.name || 'User'}</Text>
            <Text style={styles.headerRoute}>{ride.pickup_address} → {ride.drop_address}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleCall}>
              <Text style={styles.iconBtnTxt}>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleWhatsApp}>
              <Text style={styles.iconBtnTxt}>💬</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>

          <View style={styles.rideInfo}>
            <Text style={styles.rideInfoTxt}>🚗 {ride.pickup_address} → {ride.drop_address}</Text>
            <Text style={styles.rideInfoTxt}>💰 ₨{ride.cost_pkr}/person  •  💺 {ride.seats_available} seats</Text>
          </View>

          {messages.length === 0 && (
            <Text style={styles.noMsg}>No messages yet.{'\n'}Send the first message! 👋</Text>
          )}

          {messages.map(msg => (
            <View key={msg.id} style={[
              styles.msgRow,
              msg.senderId === currentUserRef.current?.id && styles.msgRowMe
            ]}>
              {msg.senderId !== currentUserRef.current?.id && (
                <View style={styles.msgAvatar}>
                  <Text style={styles.msgAvatarTxt}>{msg.senderName?.[0]}</Text>
                </View>
              )}
              <View style={[
                styles.bubble,
                msg.senderId === currentUserRef.current?.id && styles.bubbleMe
              ]}>
                <Text style={styles.bubbleTxt}>{msg.text}</Text>
                <Text style={styles.bubbleTime}>{msg.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', padding: 16, paddingTop: 50, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4fc3f7', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 18 },
  headerInfo: { flex: 1 },
  headerName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  headerRoute: { color: '#888', fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { backgroundColor: '#0f3460', borderRadius: 10, padding: 10 },
  iconBtnTxt: { fontSize: 18 },
  chatArea: { flex: 1 },
  rideInfo: { backgroundColor: '#16213e', borderRadius: 12, padding: 12, marginBottom: 16 },
  rideInfoTxt: { color: '#aaa', fontSize: 13, marginBottom: 4 },
  noMsg: { color: '#555', textAlign: 'center', marginTop: 60, fontSize: 15, lineHeight: 26 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#4fc3f7', justifyContent: 'center', alignItems: 'center' },
  msgAvatarTxt: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 12 },
  bubble: { backgroundColor: '#16213e', borderRadius: 18, borderBottomLeftRadius: 4, padding: 12, maxWidth: '75%' },
  bubbleMe: { backgroundColor: '#4fc3f7', borderBottomLeftRadius: 18, borderBottomRightRadius: 4 },
  bubbleTxt: { color: '#fff', fontSize: 14, lineHeight: 20 },
  bubbleTime: { color: '#ffffff55', fontSize: 10, marginTop: 4, textAlign: 'right' },
  inputRow: { flexDirection: 'row', padding: 12, backgroundColor: '#16213e', gap: 10, alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#0f3460', color: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn: { backgroundColor: '#4fc3f7', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendTxt: { color: '#1a1a2e', fontSize: 18, fontWeight: 'bold' },
});