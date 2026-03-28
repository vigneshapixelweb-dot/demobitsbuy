import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import Logo from '@/assets/icons/logo.svg';
import LogoName from '@/assets/icons/logoname.svg';

const SPLASH_DURATION_MS = 3000;

export default function SplashScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width, height } = useWindowDimensions();

  const logoSize = Math.min(width * 0.52, 220);
  const nameWidth = Math.min(width * 0.68, 260);

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/login');
    }, SPLASH_DURATION_MS); 

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: isDark ? DarkPalette.base : LightPalette.base },
      ]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {isDark ? (
        <>
          <View style={styles.darkDepth} />
          <View style={styles.darkGlow} />
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.04)', 'rgba(102, 102, 102, 0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.darkGradient}
          />
        </>
      ) : (
        <>
          <View style={styles.lightSurface} />
          <View style={styles.lightEdge} />
        </>
      )}

      <View style={[styles.center, { minHeight: height * 0.6 }]}>
        <Logo width={logoSize} height={logoSize} />
        <View style={styles.logoGap} />
        <LogoName width={nameWidth} height={nameWidth * 0.28} />
      </View>
    </View>
  );
}

const DarkPalette = {
  base: '#020B09',
  depth: '#000505',
  glow: '#0065534D',
  mid: '#021210',
};

const LightPalette = {
  base: '#FFFFFF',
  edge: '#FFFFFF',
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGap: {
    height: 28,
  },
  darkDepth: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DarkPalette.depth,
    opacity: 0.5,
  },
  darkGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DarkPalette.glow,
  },
  darkGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DarkPalette.mid,
    opacity: 0.9,
  },
  lightSurface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: LightPalette.base,
  },
  lightEdge: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 0,
    bottom: 0,
    borderRadius: 24,
    backgroundColor: LightPalette.edge,
  },
});
