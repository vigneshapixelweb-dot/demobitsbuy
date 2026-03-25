import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ChartIcon from '@/assets/icons/Trade/chart.svg';
import { TradingViewChart } from '@/components/ui/TradingViewChart';
import { Radii } from '@/constants/radii';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { AppColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const INTERVALS = [
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1h', value: '60' },
  { label: '4h', value: '240' },
  { label: '1D', value: 'D' },
] as const;

function getParam(value: string | string[] | undefined, fallback = '') {
  if (Array.isArray(value)) return value[0] || fallback;
  return value || fallback;
}

export default function ChartScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = AppColors[colorScheme];
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const styles = createStyles(palette);
  const params = useLocalSearchParams<{ symbol?: string | string[]; pair?: string | string[] }>();
  const [interval, setInterval] = useState<(typeof INTERVALS)[number]['value']>('15');

  const symbol = useMemo(() => {
    const raw = getParam(params.symbol, 'BTCUSDT');
    const sanitized = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return sanitized || 'BTCUSDT';
  }, [params.symbol]);

  const pairLabel = useMemo(() => {
    const rawPair = getParam(params.pair);
    if (rawPair) return rawPair;
    const base = symbol.replace(/USDT$/, '');
    return `${base || 'BTC'}/USDT`;
  }, [params.pair, symbol]);

  const chartHeight = Math.max(340, height - insets.top - insets.bottom - 170);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <View style={styles.headerTitleRow}>
            <ChartIcon width={16} height={16} color={palette.accent} />
            <Text style={styles.title}>{pairLabel} Chart</Text>
          </View>
          <Text style={styles.subtitle}>TradingView Full Screen</Text>
        </View>
      </View>

      <View style={styles.intervalRow}>
        {INTERVALS.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[styles.intervalPill, interval === item.value && styles.intervalPillActive]}
            onPress={() => setInterval(item.value)}
          >
            <Text style={[styles.intervalText, interval === item.value && styles.intervalTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.chartWrap}>
        <TradingViewChart symbol={symbol} interval={interval} height={chartHeight} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (palette: typeof AppColors.dark | typeof AppColors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xs,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    backButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: {
      color: palette.text,
      fontSize: Typography.size.xl,
      fontWeight: Typography.weight.bold,
      marginTop: -2,
    },
    headerTitleWrap: {
      flex: 1,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      color: palette.text,
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.bold,
    },
    subtitle: {
      color: palette.textMuted,
      fontSize: Typography.size.sm,
      marginTop: 2,
    },
    intervalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: Spacing.sm,
    },
    intervalPill: {
      minWidth: 48,
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: Radii.pill,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
      alignItems: 'center',
    },
    intervalPillActive: {
      borderColor: palette.accent,
      backgroundColor: `${palette.accent}20`,
    },
    intervalText: {
      color: palette.textMuted,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold,
    },
    intervalTextActive: {
      color: palette.accent,
    },
    chartWrap: {
      flex: 1,
      paddingBottom: Spacing.sm,
    },
  });
