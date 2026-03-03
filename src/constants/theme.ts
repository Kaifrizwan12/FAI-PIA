import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#0F172A',
    textSec: '#0b0b0b',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    buttonBg: '#2463EB',
    backButton: '#475569',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Inter',
    serif: 'Inter',
    rounded: 'Inter',
    mono: 'Inter',
  },
  default: {
    sans: 'Inter',
    serif: 'Inter',
    rounded: 'Inter',
    mono: 'Inter',
  },
  web: {
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    serif: 'Inter, Georgia, serif',
    rounded: 'Inter, sans-serif',
    mono: 'Inter, monospace',
  },
});
