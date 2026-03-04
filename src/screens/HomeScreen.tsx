import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import EvilIcons from 'react-native-vector-icons/EvilIcons';

import { Colors, Fonts } from '@/constants/theme';
import { getHeight, getWidth } from '@/hooks/use-responsive-sizing';
import type { RootStackParamList } from '../navigation/types';

import OverlayIcon from '../../assets/svgs/Overlay-Border-Shadow.svg';
import LottieView from 'lottie-react-native';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const colorScheme = 'light';
  const [isProfileDone, setIsProfileDone] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      const value = await AsyncStorage.getItem('profileSetupDone');
      setIsProfileDone(value === 'true');
    };
    checkProfile();
    // Re-check when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      checkProfile();
    });
    return unsubscribe;
  }, [navigation]);

  // "Get Started" — if profile is done go to Attendance, else go to ProfileSetup
  const handleGetStarted = useCallback(async () => {
    const value = await AsyncStorage.getItem('profileSetupDone');
    if (value === 'true') {
      navigation.navigate('Attendance');
    } else {
      navigation.navigate('ProfileSetup');
    }
  }, [navigation]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
      {/* Profile icon in top-right (only if profile exists) */}
      {isProfileDone && (
        <Pressable
          style={styles.profileIconBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.profileIconCircle}>
            <Ionicons
              name="person"
              size={Math.round(0.045 * getWidth())}
              color={Colors.light.buttonBg}
            />
          </View>
        </Pressable>
      )}

      <OverlayIcon width={0.167 * getWidth()} height={0.167 * getWidth()} style={styles.personImage} />
      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
        Smart Attendance
      </Text>
      <Text style={[styles.titleSec, { color: Colors[colorScheme].textSec }]}>
        Face Recognition Based Attendance with GPS Verification
      </Text>
      <LottieView
        source={require('../../assets/svgs/Face Scan.json')}
        autoPlay
        loop
        style={[styles.mainImage, { width: 0.72 * getWidth(), height: 0.65 * getWidth() }]}
      />
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, styles.gpsBadge]}>
          <EvilIcons
            name="location"
            size={0.05 * getWidth()}
            color="#2463EB"
            style={{ marginRight: 3 }}
          />
          <Text style={styles.statusText}>GPS ENABLED</Text>
        </View>
        <View style={[styles.statusBadge, styles.secureBadge]}>
          <Ionicons
            name="shield-checkmark-outline"
            size={0.05 * getWidth()}
            color="#059668"
            style={{ marginRight: 3 }}
          />
          <Text style={styles.status2Text}>SECURE</Text>
        </View>
      </View>
      <Pressable
        style={styles.button}
        onPress={handleGetStarted}
      >
        <Text style={styles.buttonText}>Get Started</Text>
        <AntDesign name="arrowright" size={Math.round(0.046 * getWidth())} color="white" />
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0.01 * getWidth(), marginTop: 0.02 * getHeight() }}>
        <Ionicons
          name="shield-checkmark-outline"
          size={Math.round(0.036 * getWidth())}
          color={Colors[colorScheme].textSec}
        />
        <Text
          style={[styles.titleSec2, { color: Colors[colorScheme].textSec }]}
        >
          Secure & Location Verified
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  profileIconBtn: {
    position: 'absolute',
    top: 0.05 * getHeight(),
    right: 0.051 * getWidth(),
    zIndex: 10,
  },
  profileIconCircle: {
    width: 0.1 * getWidth(),
    height: 0.1 * getWidth(),
    borderRadius: 0.05 * getWidth(),
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#2463eb31',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSec2: {
    fontSize: 0.03 * getWidth(),
    fontWeight: '400',
    textAlign: 'center',
  },

  button: {
    backgroundColor: Colors.light.buttonBg,
    paddingVertical: 0.019 * getHeight(),
    paddingHorizontal: 0.062 * getWidth(),
    borderRadius: 0.09 * getWidth(),
    alignItems: 'center',
    gap: 0.02 * getWidth(),
    width: '80%',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 0.1 * getHeight(),
  },
  buttonText: {
    color: '#fff',
    fontSize: 0.045 * getWidth(),
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },

  personImage: {
    width: 0.167 * getWidth(),
    height: 0.167 * getWidth(),
    marginTop: 0.07 * getHeight(),
    marginBottom: 0.019 * getHeight(),
  },
  title: {
    fontSize: 0.06 * getWidth(),
    fontWeight: '700',
    fontFamily: Fonts.sans,
  },
  mainImage: {
    marginTop: 0.07 * getHeight(),
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0.02 * getWidth(),
    marginTop: 0.014 * getHeight(),
  },
  statusBadge: {
    borderRadius: 999,
    paddingVertical: 0.007 * getHeight(),
    paddingHorizontal: 0.031 * getWidth(),
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsBadge: {
    backgroundColor: '#2463eb31',
  },
  secureBadge: {
    backgroundColor: '#0596682a',
  },
  statusText: {
    color: '#2463EB',
    fontSize: 0.03 * getWidth(),
    fontWeight: '700',
    opacity: 1,
    letterSpacing: 0.3,
  },
  status2Text: {
    color: '#059668',
    fontSize: 0.03 * getWidth(),
    fontWeight: '700',
    opacity: 1,
    letterSpacing: 0.3,
  },
  titleSec: {
    fontSize: 0.04 * getWidth(),
    fontWeight: '400',
    marginTop: 0.01 * getHeight(),
    alignItems: 'center',
    textAlign: 'center',
    width: '80%',
  },
});
