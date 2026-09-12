import React from 'react';
import { Platform } from 'react-native';

export default function MapPicker(props) {
  if (typeof Platform.OS === 'undefined' || Platform.OS === 'web') {
    // Use MapPickerWeb on web platforms
    try {
      const MapPickerWeb = require('./MapPickerWeb').default;
      return <MapPickerWeb {...props} />;
    } catch (e) {
      console.warn('Could not load MapPickerWeb:', e);
    }
  }
  
  // Use MapPickerNative on native platforms
  try {
    const MapPickerNative = require('./MapPickerNative').default;
    return <MapPickerNative {...props} />;
  } catch (e) {
    console.warn('Could not load MapPickerNative:', e);
    return null;
  }
}