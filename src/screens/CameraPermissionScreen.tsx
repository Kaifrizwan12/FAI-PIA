import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCameraPermission } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Colors, Fonts } from '@/constants/theme';
import { getHeight, getWidth } from '@/hooks/use-responsive-sizing';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CameraPermission'>;

export default function CameraPermissionScreen() {
  const navigation = useNavigation<Nav>();
  const { hasPermission, requestPermission } = useCameraPermission();

  const handleRequestPermission = useCallback(async () => {
    const result = await requestPermission();
    if (result) {
      // Permission granted, proceed to profile setup
      navigation.replace('ProfileSetup');
    }
  }, [requestPermission, navigation]);

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  // If already has permission, go straight to ProfileSetup
  if (hasPermission) {
    navigation.replace('ProfileSetup');
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="camera-outline" size={0.12 * getWidth()} color="#fff" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Camera Access Required</Text>

        {/* Description */}
        <Text style={styles.description}>
          We need access to your camera to capture your face for the profile setup and attendance verification.
        </Text>

        {/* Features List */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={0.06 * getWidth()} color={Colors.light.buttonBg} />
            <Text style={styles.featureText}>Face registration during setup</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={0.06 * getWidth()} color={Colors.light.buttonBg} />
            <Text style={styles.featureText}>Daily attendance check-in</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={0.06 * getWidth()} color={Colors.light.buttonBg} />
            <Text style={styles.featureText}>Real-time face verification</Text>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.primaryBtn}
          onPress={handleRequestPermission}
        >
          <Text style={styles.primaryBtnText}>Allow Camera Access</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={handleOpenSettings}
        >
          <Text style={styles.secondaryBtnText}>Open Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'space-between',
    paddingHorizontal: 0.062 * getWidth(),
    paddingVertical: 0.08 * getHeight(),
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 0.22 * getWidth(),
    height: 0.22 * getWidth(),
    borderRadius: 0.11 * getWidth(),
    backgroundColor: Colors.light.buttonBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0.04 * getHeight(),
  },
  title: {
    fontSize: 0.072 * getWidth(),
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 0.02 * getHeight(),
    textAlign: 'center',
    fontFamily: Fonts.sans,
  },
  description: {
    fontSize: 0.042 * getWidth(),
    color: Colors.light.textSec,
    textAlign: 'center',
    marginBottom: 0.04 * getHeight(),
    lineHeight: 0.062 * getWidth(),
    fontFamily: Fonts.sans,
  },
  featuresList: {
    width: '100%',
    gap: 0.02 * getHeight(),
    marginTop: 0.03 * getHeight(),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0.03 * getWidth(),
  },
  featureText: {
    fontSize: 0.042 * getWidth(),
    color: Colors.light.text,
    fontFamily: Fonts.sans,
    flex: 1,
  },
  buttonContainer: {
    gap: 0.02 * getHeight(),
  },
  primaryBtn: {
    backgroundColor: Colors.light.buttonBg,
    paddingVertical: 0.018 * getHeight(),
    borderRadius: 0.03 * getWidth(),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 0.048 * getWidth(),
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: Colors.light.buttonBg,
    paddingVertical: 0.018 * getHeight(),
    borderRadius: 0.03 * getWidth(),
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: Colors.light.buttonBg,
    fontSize: 0.048 * getWidth(),
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
});
