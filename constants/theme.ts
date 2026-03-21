/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
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
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'Geist-Regular',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'Geist-Regular',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'Geist-Regular',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'Geist-Regular',
  },
  default: {
    sans: 'Geist-Regular',
    serif: 'Geist-Regular',
    rounded: 'Geist-Regular',
    mono: 'Geist-Regular',
  },
  web: {
    sans: "'Geist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "'Geist', Georgia, 'Times New Roman', serif",
    rounded: "'Geist', 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "'Geist', SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const AppColors = {
  dark: {
    background: '#020B09',
    backgroundAlt: '#000505',
    surface: '#021210',
    surfaceMuted: '#0065531A',
    border: '#275049',
    text: '#FFFFFF',
    textMuted: '#75817C',
    primary: '#006553',
    primaryAlt: '#026D58',
    onPrimary: '#FFFFFF',
    accent: '#3DFFDC',
    alert: '#3DFFDC',
    checkbox: '#0065531A',
    transparent: 'transparent',
    gradients: {
      background: ['rgba(255, 255, 255, 0.04)', 'rgba(102, 102, 102, 0)'],
      segment: ['#001D18', '#025A4A', '#001D18'],
      button: ['#00120F', '#025A4A', '#00120F'],
      input: ['rgba(255, 255, 255, 0.077)', 'rgba(255, 255, 255, 0.033)'],
    },
  },
  light: {
    background: '#FFFFFF',
    backgroundAlt: '#FFFFFF',
    surface: '#EFEFEF',
    surfaceMuted: '#D6D6D6',
    border: '#D6D6D6',
    text: '#021210',
    textMuted: '#75817C',
    primary: '#006553',
    primaryAlt: '#026D58',
    onPrimary: '#FFFFFF',
    accent: '#006553',
    alert: '#026D58',
    checkbox: '#0065531A',
    transparent: 'transparent',
    gradients: {
      background: ['rgba(255, 255, 255, 0.232)', 'rgba(244, 244, 244, 0.128)', 'rgba(255, 255, 255, 0.128)'],
      segment: ['rgba(255, 255, 255, 0.232)', 'rgba(244, 244, 244, 0.128)', 'rgba(255, 255, 255, 0.128)'],
      button: ['#00120F', '#025A4A', '#00120F'],
      input: ['rgba(255, 255, 255, 0.232)', 'rgba(244, 244, 244, 0.128)'],
    },
  },
} as const;
