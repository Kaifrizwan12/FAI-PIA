import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Colors, Fonts } from '@/constants/theme';
import { getHeight, getWidth } from '@/hooks/use-responsive-sizing';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Status'>;
type StatusRoute = RouteProp<RootStackParamList, 'Status'>;

export default function StatusScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<StatusRoute>();
  const [isProfileDone, setIsProfileDone] = useState(false);

  const { matched, similarity } = route.params;
  const similarityPercent = Math.round(similarity * 100);

  useEffect(() => {
    const checkProfile = async () => {
      const value = await AsyncStorage.getItem('profileSetupDone');
      setIsProfileDone(value === 'true');
    };
    checkProfile();
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <View style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}>
          <Ionicons name="arrow-back" size={Math.round(0.062 * getWidth())} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Attendance Status</Text>
        {isProfileDone ? (
          <Pressable style={styles.backBtn} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle-outline" size={Math.round(0.072 * getWidth())} color={Colors.light.buttonBg} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      {/* status icon */}
      <View style={[styles.iconCircleOuter, !matched && styles.iconCircleOuterFail]}>
        <View style={[styles.iconCircleInner, !matched && styles.iconCircleInnerFail]}>
          <Ionicons
            name={matched ? 'checkmark' : 'close'}
            size={0.09 * getWidth()}
            color="#fff"
          />
        </View>
      </View>

      {/* status text */}
      {matched ? (
        <>
          <Text style={styles.title}>Attendance Marked{'\n'}Successfully</Text>
          <Text style={styles.subtitle}>
            Your check-in has been recorded and{'\n'}verified by the system.
          </Text>
        </>
      ) : (
        <>
          <Text style={[styles.title, styles.titleFail]}>Verification{'\n'}Failed</Text>
          <Text style={styles.subtitle}>
            Face does not match the stored profile.{'\n'}Please try again.
          </Text>
        </>
      )}

      {/* details card */}
      <View style={styles.card}>
        {/* date row */}
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons name="calendar-outline" size={Math.round(0.051 * getWidth())} color={Colors.light.buttonBg} />
          </View>
          <View>
            <Text style={styles.rowLabel}>DATE</Text>
            <Text style={styles.rowValue}>{dateStr}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* time row */}
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons name="time-outline" size={Math.round(0.051 * getWidth())} color={Colors.light.buttonBg} />
          </View>
          <View>
            <Text style={styles.rowLabel}>TIME</Text>
            <Text style={styles.rowValue}>{timeStr}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* face match row */}
        <View style={styles.row}>
          <View style={[styles.rowIcon, !matched && styles.rowIconFail]}>
            <Ionicons
              name={matched ? 'happy-outline' : 'sad-outline'}
              size={Math.round(0.051 * getWidth())}
              color={matched ? Colors.light.buttonBg : '#DC2626'}
            />
          </View>
          <View>
            <Text style={styles.rowLabel}>FACE MATCH</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0.01 * getWidth() }}>
              <Ionicons
                name={matched ? 'checkmark-circle' : 'close-circle'}
                size={Math.round(0.041 * getWidth())}
                color={matched ? '#059668' : '#DC2626'}
              />
              <Text style={matched ? styles.rowValueGreen : styles.rowValueRed}>
                {similarityPercent}% {matched ? 'Match' : 'No Match'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* location row */}
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons name="location-outline" size={Math.round(0.051 * getWidth())} color={Colors.light.buttonBg} />
          </View>
          <View>
            <Text style={styles.rowLabel}>LOCATION VERIFIED</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0.01 * getWidth() }}>
              <Ionicons name="checkmark-circle" size={Math.round(0.041 * getWidth())} color="#059668" />
              <Text style={styles.rowValueGreen}>Yes</Text>
            </View>
          </View>
        </View>
      </View>

      {/* bottom button */}
      {matched ? (
        <Pressable style={styles.doneBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}>
          <Text style={styles.doneBtnTxt}>Done</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="camera-reverse-outline" size={Math.round(0.051 * getWidth())} color="#fff" />
          <Text style={styles.doneBtnTxt}>Try Again</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    height: 0.09 * getHeight(),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0.051 * getWidth(),
    paddingTop: 0.022 * getHeight(),
    backgroundColor: Colors.light.background,
  },
  backBtn: {
    width: 0.103 * getWidth(),
    height: 0.103 * getWidth(),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 0.046 * getWidth(),
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: Fonts.sans,
  },

  /* status icon */
  iconCircleOuter: {
    marginTop: 0.06 * getHeight(),
    width: 0.27 * getWidth(),
    height: 0.27 * getWidth(),
    borderRadius: 0.14 * getWidth(),
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleOuterFail: {
    backgroundColor: '#FEE2E2',
  },
  iconCircleInner: {
    width: 0.19 * getWidth(),
    height: 0.19 * getWidth(),
    borderRadius: 0.1 * getWidth(),
    backgroundColor: '#059668',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059668',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircleInnerFail: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },

  /* text */
  title: {
    marginTop: 0.03 * getHeight(),
    fontSize: 0.056 * getWidth(),
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    fontFamily: Fonts.sans,
    lineHeight: 0.036 * getHeight(),
  },
  titleFail: {
    color: '#DC2626',
  },
  subtitle: {
    marginTop: 0.012 * getHeight(),
    fontSize: 0.036 * getWidth(),
    color: Colors.light.backButton,
    textAlign: 'center',
    fontFamily: Fonts.sans,
    lineHeight: 0.024 * getHeight(),
  },

  /* details card */
  card: {
    marginTop: 0.04 * getHeight(),
    width: 0.82 * getWidth(),
    backgroundColor: Colors.light.background,
    borderRadius: 0.051 * getWidth(),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 0.01 * getHeight(),
    paddingHorizontal: 0.051 * getWidth(),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0.036 * getWidth(),
    paddingVertical: 0.017 * getHeight(),
  },
  rowIcon: {
    width: 0.103 * getWidth(),
    height: 0.103 * getWidth(),
    borderRadius: 0.051 * getWidth(),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowIconFail: {
    backgroundColor: '#FEF2F2',
  },
  rowLabel: {
    fontSize: 0.028 * getWidth(),
    fontWeight: '600',
    color: Colors.light.backButton,
    letterSpacing: 0.6,
    fontFamily: Fonts.sans,
    marginBottom: 0.002 * getHeight(),
  },
  rowValue: {
    fontSize: 0.041 * getWidth(),
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: Fonts.sans,
  },
  rowValueGreen: {
    fontSize: 0.041 * getWidth(),
    fontWeight: '700',
    color: '#059668',
    fontFamily: Fonts.sans,
  },
  rowValueRed: {
    fontSize: 0.041 * getWidth(),
    fontWeight: '700',
    color: '#DC2626',
    fontFamily: Fonts.sans,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  /* buttons */
  doneBtn: {
    marginTop: 0.05 * getHeight(),
    width: 0.82 * getWidth(),
    backgroundColor: Colors.light.buttonBg,
    paddingVertical: 0.019 * getHeight(),
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: Colors.light.buttonBg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  retryBtn: {
    marginTop: 0.05 * getHeight(),
    width: 0.82 * getWidth(),
    backgroundColor: '#DC2626',
    paddingVertical: 0.019 * getHeight(),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 0.02 * getWidth(),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  doneBtnTxt: {
    color: '#fff',
    fontSize: 0.041 * getWidth(),
    fontWeight: '700',
    fontFamily: Fonts.sans,
  },
});
