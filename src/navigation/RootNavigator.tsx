import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import CameraPermissionScreen from '../screens/CameraPermissionScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import StatusScreen from '../screens/StatusScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import ProfileScreen from '../screens/ProfileScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  // Always start at Home. The Home screen's "Get Started" button
  // checks AsyncStorage and routes to CameraPermission (if needed) then ProfileSetup or Attendance.
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="CameraPermission" component={CameraPermissionScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="Status" component={StatusScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
