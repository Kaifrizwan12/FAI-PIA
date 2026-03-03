import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Colors, Fonts } from '@/constants/theme';
import { getHeight, getWidth } from '@/hooks/use-responsive-sizing';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Status'>;

export default function StatusScreen() {
  const navigation = useNavigation<Nav>();

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
        <View style={styles.backBtn} />
      </View>

      {/* success icon */}
      <View style={styles.iconCircleOuter}>
        <View style={styles.iconCircleInner}>
          <Ionicons name="checkmark" size={0.09 * getWidth()} color="#fff" />
        </View>
      </View>

      {/* success text */}
      <Text style={styles.title}>Attendance Marked{'\n'}Successfully</Text>
      <Text style={styles.subtitle}>
        Your check-in has been recorded and{'\n'}verified by the system.
      </Text>

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

      {/* done button */}
      <Pressable style={styles.doneBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}>
        <Text style={styles.doneBtnTxt}>Done</Text>
      </Pressable>
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

  /* success icon */
  iconCircleOuter: {
    marginTop: 0.06 * getHeight(),
    width: 0.27 * getWidth(),
    height: 0.27 * getWidth(),
    borderRadius: 0.14 * getWidth(),
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
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
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  /* done button */
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
  doneBtnTxt: {
    color: '#fff',
    fontSize: 0.041 * getWidth(),
    fontWeight: '700',
    fontFamily: Fonts.sans,
  },
});
