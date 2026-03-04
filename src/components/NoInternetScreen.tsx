import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

import { Colors, Fonts } from '@/constants/theme';
import { getHeight, getWidth } from '@/hooks/use-responsive-sizing';

type Props = {
  onRetry: () => void;
};

export default function NoInternetScreen({ onRetry }: Props) {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/svgs/No Internet.json')}
        autoPlay
        loop
        style={styles.lottie}
      />

      <Text style={styles.title}>No Internet Connection</Text>
      <Text style={styles.subtitle}>
        Please check your Wi-Fi or mobile data{'\n'}and try again.
      </Text>

      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0.062 * getWidth(),
  },
  lottie: {
    width: 0.55 * getWidth(),
    height: 0.55 * getWidth(),
    marginBottom: 0.02 * getHeight(),
  },
  title: {
    fontSize: 0.056 * getWidth(),
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    marginBottom: 0.01 * getHeight(),
  },
  subtitle: {
    fontSize: 0.036 * getWidth(),
    fontWeight: '400',
    color: Colors.light.backButton,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    lineHeight: 0.024 * getHeight(),
    marginBottom: 0.04 * getHeight(),
  },
  retryBtn: {
    backgroundColor: Colors.light.buttonBg,
    paddingVertical: 0.019 * getHeight(),
    paddingHorizontal: 0.062 * getWidth(),
    borderRadius: 999,
    width: '80%',
    alignItems: 'center',
    shadowColor: Colors.light.buttonBg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 0.045 * getWidth(),
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
});
