import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View, ActivityIndicator } from 'react-native';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import FindRideScreen from './screens/FindRideScreen';
import OfferRideScreen from './screens/OfferRideScreen';
import MyRidesScreen from './screens/MyRidesScreen';
import ProfileScreen from './screens/ProfileScreen';
import RideDetailScreen from './screens/RideDetailScreen';
import MessagesScreen from './screens/MessagesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('token').then(t => {
      setIsLoggedIn(!!t);
      setLoading(false);
    });
  }, []);

  function handleLogin() { setIsLoggedIn(true); }
  function handleLogout() { setIsLoggedIn(false); }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4fc3f7" />
      </View>
    );
  }

  function MainTabs() {
    return (
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: '#1a1a2e', borderTopColor: '#16213e' },
          tabBarActiveTintColor: '#4fc3f7',
          tabBarInactiveTintColor: '#888',
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
        }}>
        <Tab.Screen name="Home" component={HomeScreen}
          options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>, tabBarLabel: 'Home' }} />
        <Tab.Screen name="FindRide" component={FindRideScreen}
          options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🔍</Text>, tabBarLabel: 'Find Ride', headerTitle: 'Find a Ride' }} />
        <Tab.Screen name="OfferRide" component={OfferRideScreen}
          options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🚗</Text>, tabBarLabel: 'Offer Ride', headerTitle: 'Offer a Ride' }} />
        <Tab.Screen name="MyRides" component={MyRidesScreen}
          options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text>, tabBarLabel: 'My Rides', headerTitle: 'My Rides' }} />
        <Tab.Screen name="Profile"
          options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>, tabBarLabel: 'Profile' }}>
          {props => <ProfileScreen {...props} onLogout={handleLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    );
  }

  if (!isLoggedIn) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {props => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
          <Stack.Screen name="Register">
            {props => <RegisterScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="RideDetail" component={RideDetailScreen} />
        <Stack.Screen name="Messages" component={MessagesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}