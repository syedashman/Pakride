import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';

export default function MapPickerNative({ pickup, drop, onPickupSelect, onDropSelect }) {
  const [pickupText, setPickupText] = useState('');
  const [dropText, setDropText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeField, setActiveField] = useState('pickup');

  async function handleSearch(text, field) {
    if (field === 'pickup') setPickupText(text);
    else setDropText(text);
    setActiveField(field);
    if (text.length < 2) { 
      setSuggestions([]); 
      return; 
    }
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
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Pickup location"
        value={pickupText}
        onChangeText={(text) => handleSearch(text, 'pickup')}
      />
      <TextInput
        style={styles.input}
        placeholder="Drop location"
        value={dropText}
        onChangeText={(text) => handleSearch(text, 'drop')}
      />
      {searching && <Text>Searching...</Text>}
      <ScrollView style={styles.suggestionsContainer}>
        {suggestions.map((item, index) => (
          <Text
            key={index}
            style={styles.suggestion}
            onPress={() => selectSuggestion(item)}
          >
            {item.display_name}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  suggestionsContainer: {
    maxHeight: 200,
  },
  suggestion: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    color: '#007AFF',
  },
});
