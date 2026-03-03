import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import EvilIcons from 'react-native-vector-icons/EvilIcons';

import { Colors, Fonts } from '@/constants/theme';
import { getHeight, getWidth } from '@/hooks/use-responsive-sizing';
import type { RootStackParamList } from '../navigation/types';

import OverlayIcon from '../../assets/svgs/Overlay-Border-Shadow.svg';
import LottieView from 'lottie-react-native';

// to create a strongly-typed navigation prop for the Home screen, we define a type Nav that uses NativeStackNavigationProp with our RootStackParamList and the 'Home' route. This allows us to have type safety when navigating from the Home screen.
type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  // useNavigation hook is used to get the navigation object, and we specify that it should be of type Nav to ensure type safety when navigating to other screens.
  const navigation = useNavigation<Nav>();
  const colorScheme = 'light';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
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
        onPress={() => navigation.navigate('Attendance')}
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
    // height: 0.4 * getHeight(),
    marginTop: 0.07 * getHeight(),
    // width: '100%',
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
