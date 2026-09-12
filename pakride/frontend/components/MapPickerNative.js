import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Keyboard, ScrollView, Platform } from 'react-native';

// Conditionally import maps - will be undefined on web
let MapView = null;
let Marker = null;
let Polyline = null;

try {
  if (Platform.OS !== 'web') {
    const maps = require('react-native-maps');
    MapView = maps.default || maps.MapView;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
  }
} catch (e) {
  // Maps not available - will render fallback on web
}

export default function MapPickerNative({ pickup, drop, onPickupSelect, onDropSelect }) {
  // Fallback for web platform
  if (Platform.OS === 'web' || !MapView) {
    return (
      <View style={styles.container}>
        <View style={styles.webFallback}>
          <Text style={styles.webText}>🗺️ Use MapPickerWeb for web platform</Text>
        </View>
      </View>
    );
  }

  const [activeField, setActiveField] = useState('pickup');
  const [pickupText, setPickupText] = useState('');
  const [dropText, setDropText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => { if (pickup) setPickupText(pickup.name); }, [pickup]);
  useEffect(() => { if (drop) setDropText(drop.name); }, [drop]);

 async function handleSearch(text, field) {
    if (field === 'pickup') setPickupText(text);
    else setDropText(text);
    setActiveField(field);
    if (text.length < 2) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=6&countrycodes=pk&viewbox=66.6,25.5,67.6,24.5&bounded=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    }
    setSearching(false);
  }

  function selectSuggestion(item) {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const name = item.display_name.split(',').slice(0, 2).join(', ');
    const place = { name, lat, lng };

    if (activeField === 'pickup') {
      onPickupSelect(place);
      setPickupText(name);
      setActiveField('drop');
    } else {
      onDropSelect(place);
      setDropText(name);
    }
    setSuggestions([]);
    Keyboard.dismiss();

    mapRef.current?.animateToRegion({
      latitude: lat, longitude: lng,
      latitudeDelta: 0.08, longitudeDelta: 0.08
    });
  }

  async function handleMapPress(e) {
    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      const name = data.display_name?.split(',').slice(0, 2).join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const place = { name, lat, lng };
      if (activeField === 'pickup') { onPickupSelect(place); setPickupText(name); setActiveField('drop'); }
      else { onDropSelect(place); setDropText(name); }
    } catch {
      const name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const place = { name, lat, lng };
      if (activeField === 'pickup') { onPickupSelect(place); setPickupText(name); }
      else { onDropSelect(place); setDropText(name); }
    }
    setSuggestions([]);
  }

  const mapRegion = pickup ? {
    latitude: pickup.lat, longitude: pickup.lng,
    latitudeDelta: 0.15, longitudeDelta: 0.15
  } : {
    latitude: 24.8607, longitude: 67.0104,
    latitudeDelta: 0.3, longitudeDelta: 0.3
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion}
        onPress={handleMapPress}
      >
        {pickup && <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} pinColor="green" title="Pickup" />}
        {drop && <Marker coordinate={{ latitude: drop.lat, longitude: drop.lng }} pinColor="red" title="Drop" />}
        {pickup && drop && (
          <Polyline
            coordinates={[
              { latitude: pickup.lat, longitude: pickup.lng },
              { latitude: drop.lat, longitude: drop.lng }
            ]}
            strokeColor="#4fc3f7"
            strokeWidth={3}
          />
        )}
      </MapView>

      <View style={styles.searchPanel}>
        <View style={styles.inputRow}>
          <View style={styles.dotCol}>
            <View style={styles.dotGreen} />
            <View style={styles.dotLine} />
            <View style={styles.dotRed} />
          </View>
          <View style={styles.inputCol}>
            <TextInput
              style={[styles.input, activeField === 'pickup' && styles.inputActive]}
              placeholder="Enter Pickup Location"
              placeholderTextColor="#888"
              value={pickupText}
              onChangeText={t => handleSearch(t, 'pickup')}
              onFocus={() => setActiveField('pickup')}
            />
            <View style={styles.divider} />
            <TextInput
              style={[styles.input, activeField === 'drop' && styles.inputActive]}
              placeholder="Enter Dropoff Location"
              placeholderTextColor="#888"
              value={dropText}
              onChangeText={t => handleSearch(t, 'drop')}
              onFocus={() => setActiveField('drop')}
            />
          </View>
        </View>

        {searching && <ActivityIndicator color="#4fc3f7" style={{ marginTop: 8 }} />}

        {suggestions.length > 0 && (
          <View style={styles.suggestionList}>
            {suggestions.map((item, i) => (
              <TouchableOpacity key={i} style={styles.suggItem} onPress={() => selectSuggestion(item)}>
                <Text style={styles.suggIcon}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggName}>{item.display_name.split(',')[0]}</Text>
                  <Text style={styles.suggSub}>{item.display_name.split(',').slice(1, 3).join(', ')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 500, backgroundColor: '#1a1a2e', borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  map: { flex: 1 },
  searchPanel: { backgroundColor: '#fff', padding: 14, paddingBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dotCol: { alignItems: 'center', paddingVertical: 4 },
  dotGreen: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#4caf50', borderWidth: 2, borderColor: '#fff' },
  dotLine: { width: 2, height: 28, backgroundColor: '#ddd', marginVertical: 4 },
  dotRed: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#f44336', borderWidth: 2, borderColor: '#fff' },
  inputCol: { flex: 1 },
  input: { paddingVertical: 8, paddingHorizontal: 4, fontSize: 15, color: '#333' },
  inputActive: { color: '#1a1a2e', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 2 },
  suggestionList: { maxHeight: 200, marginTop: 8 },
  suggItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggIcon: { fontSize: 16, marginTop: 2 },
  suggName: { color: '#333', fontSize: 14, fontWeight: '500' },
  suggSub: { color: '#888', fontSize: 12, marginTop: 2 },
});