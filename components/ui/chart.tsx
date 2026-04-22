import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TradingViewChart } from '@/components/ui/TradingViewChart';
import { Radii } from '@/constants/radii';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { AppColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const QUICK_INTERVALS = ['1m', '15m', '1h', '4h', '1D'] as const;
const MORE_ROWS = [
  ['3m', '5m', '30m', '2h'],
  ['6h', '8h', '12h', '1W'],
  ['1M', '3M', '', ''],
] as const;
const OVERLAYS = ['MA', 'EMA', 'BOLL', 'SAR', 'AVL'] as const;
const SUB_PANELS = ['VOL', 'MACD', 'KDJ', 'RSI', 'ROC', 'CCI', 'WR'] as const;

type Ticker24h = {
  last: number;
  high: number;
  low: number;
  vol: number;
  turnover: number;
  changePct: number;
};

function getParam(value: string | string[] | undefined, fallback = '') {
  if (Array.isArray(value)) return value[0] || fallback;
  return value || fallback;
}

function formatVol(v: number) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toFixed(2);
}

function intervalToMs(interval: string) {
  const map: Record<string, number> = {
    '1m': 60_000,
    '3m': 3 * 60_000,
    '5m': 5 * 60_000,
    '15m': 15 * 60_000,
    '30m': 30 * 60_000,
    '1h': 60 * 60_000,
    '2h': 2 * 60 * 60_000,
    '4h': 4 * 60 * 60_000,
    '6h': 6 * 60 * 60_000,
    '8h': 8 * 60 * 60_000,
    '12h': 12 * 60 * 60_000,
    '1D': 24 * 60 * 60_000,
    '1W': 7 * 24 * 60 * 60_000,
    '1M': 30 * 24 * 60 * 60_000,
    '3M': 90 * 24 * 60 * 60_000,
  };
  return map[interval] ?? 15 * 60_000;
}

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ChartScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = AppColors[colorScheme];
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const styles = createStyles(palette);
  const params = useLocalSearchParams<{ symbol?: string | string[]; pair?: string | string[] }>();

  const [interval, setChartInterval] = useState<string>('1D');
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showNews, setShowNews] = useState(true);
  const [newsIndex, setNewsIndex] = useState(0);
  const [ticker, setTicker] = useState<Ticker24h | null>(null);
  const [candleRemaining, setCandleRemaining] = useState('--:--');

  const [showMA, setShowMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [showBOLL, setShowBOLL] = useState(true);
  const [showSAR, setShowSAR] = useState(false);
  const [showAVL, setShowAVL] = useState(false);
  const [subIndicators, setSubIndicators] = useState<string[]>(['VOL', 'RSI', 'MACD']);

  const newsItems = [
    'Market volatility increased after US macro data release.',
    'Binance spot volume shows strong momentum this week.',
    'Large-cap coins lead intraday recovery in Asian session.',
    'Risk sentiment improves as BTC holds above key support.',
  ];

  const symbol = useMemo(() => {
    const raw = getParam(params.symbol, 'BTCUSDT');
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return cleaned || 'BTCUSDT';
  }, [params.symbol]);

  const pairLabel = useMemo(() => {
    const rawPair = getParam(params.pair);
    if (rawPair) return rawPair;
    const base = symbol.replace(/USDT$/, '');
    return `${base || 'BTC'}/USDT`;
  }, [params.pair, symbol]);

  const baseAsset = useMemo(() => pairLabel.split('/')[0] || 'BTC', [pairLabel]);
  const quoteAsset = useMemo(() => pairLabel.split('/')[1] || 'USDT', [pairLabel]);

  const subCount = subIndicators.length;
  const mainHeight = Math.min(370, Math.max(220, height * 0.38));
  const chartHeight = mainHeight + subCount * 83;

  const price = ticker?.last ?? 0;
  const changePct = ticker?.changePct ?? 0;
  const isBull = changePct >= 0;
  const priceColor = isBull ? '#2EBD85' : '#F6465D';

  useEffect(() => {
    let isActive = true;
    const loadTicker = async () => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
        if (!res.ok) return;
        const j = await res.json();
        if (!isActive) return;
        setTicker({
          last: Number(j?.lastPrice ?? 0),
          high: Number(j?.highPrice ?? 0),
          low: Number(j?.lowPrice ?? 0),
          vol: Number(j?.volume ?? 0),
          turnover: Number(j?.quoteVolume ?? 0),
          changePct: Number(j?.priceChangePercent ?? 0),
        });
      } catch {
        // silent fail for ticker card
      }
    };
    loadTicker();
    const timer = global.setInterval(loadTicker, 10000);
    return () => {
      isActive = false;
      clearInterval(timer);
    };
  }, [symbol]);

  useEffect(() => {
    const updateCountdown = () => {
      const frameMs = intervalToMs(interval);
      const now = Date.now();
      const nextClose = Math.ceil(now / frameMs) * frameMs;
      setCandleRemaining(formatRemaining(nextClose - now));
    };
    updateCountdown();
    const timer = global.setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [interval]);

  const toggleOverlay = (key: string) => {
    if (key === 'MA') setShowMA((v) => !v);
    if (key === 'EMA') setShowEMA((v) => !v);
    if (key === 'BOLL') setShowBOLL((v) => !v);
    if (key === 'SAR') setShowSAR((v) => !v);
    if (key === 'AVL') setShowAVL((v) => !v);
  };

  const toggleSubPanel = (key: string) => {
    setSubIndicators((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const isOverlayActive = (key: string) => {
    if (key === 'MA') return showMA;
    if (key === 'EMA') return showEMA;
    if (key === 'BOLL') return showBOLL;
    if (key === 'SAR') return showSAR;
    if (key === 'AVL') return showAVL;
    return false;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 14 }}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Pressable style={styles.pairButton}>
            <Text style={styles.pairText}>{pairLabel}</Text>
            <Text style={styles.dropdownText}>▾</Text>
          </Pressable>
          <Text style={[styles.changeText, { color: priceColor }]}>
            {changePct >= 0 ? '+' : ''}
            {changePct.toFixed(2)}%
          </Text>
          <View style={[styles.liveDot, { backgroundColor: palette.accent }]} />
        </View>

        <View style={styles.priceHeader}>
          <View style={styles.priceMainRow}>
            <Text style={[styles.priceMain, { color: priceColor }]}>
              {price > 0 ? price.toFixed(2) : '--'}
            </Text>
            <Text style={styles.priceApprox}>
              {price > 0 ? `≈$${price.toFixed(2)}` : '--'}
            </Text>
          </View>
          <Text style={styles.candleCountdown}>Candle closes in {candleRemaining}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>24h high</Text>
              <Text style={styles.statValue}>{ticker ? ticker.high.toFixed(2) : '--'}</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>24h low</Text>
              <Text style={styles.statValue}>{ticker ? ticker.low.toFixed(2) : '--'}</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>24h Vol ({baseAsset})</Text>
              <Text style={styles.statValue}>{ticker ? formatVol(ticker.vol) : '--'}</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Turnover ({quoteAsset})</Text>
              <Text style={styles.statValue}>{ticker ? formatVol(ticker.turnover) : '--'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabRow}>
          {['Chart', 'Data', 'Square', 'About'].map((tab) => {
            const active = tab === 'Chart';
            return (
              <View key={tab} style={styles.tabItem}>
                <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>{tab}</Text>
                <View style={[styles.tabIndicator, active ? styles.tabIndicatorActive : null]} />
              </View>
            );
          })}
        </View>

        {showNews ? (
          <View style={styles.newsRow}>
            <Text style={styles.newsIcon}>📣</Text>
            <Pressable style={styles.newsContent} onPress={() => setNewsIndex((n) => (n + 1) % newsItems.length)}>
              <Text style={styles.newsText} numberOfLines={1}>
                {newsItems[newsIndex]}
              </Text>
            </Pressable>
            <Pressable onPress={() => setShowNews(false)}>
              <Text style={styles.newsClose}>✕</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.intervalRow}>
          {QUICK_INTERVALS.map((iv) => {
            const active = iv === interval;
            return (
              <Pressable
                key={iv}
                onPress={() => setChartInterval(iv)}
                style={[styles.intervalChip, active ? styles.intervalChipActive : null]}
              >
                <Text style={[styles.intervalText, active ? styles.intervalTextActive : null]}>{iv}</Text>
              </Pressable>
            );
          })}
          <Pressable style={styles.moreChip} onPress={() => setShowMoreSheet(true)}>
            <Text style={styles.moreText}>{QUICK_INTERVALS.includes(interval as any) ? 'More' : interval}</Text>
            <Text style={styles.moreCaret}>▾</Text>
          </Pressable>
          <View style={styles.toolsRight}>
            <Text style={styles.toolIcon}>◫</Text>
            <Text style={styles.toolIcon}>✎</Text>
            <Text style={styles.toolIcon}>⚙︎</Text>
          </View>
        </View>

        <View style={styles.chartBox}>
          <TradingViewChart
            symbol={symbol}
            interval={interval}
            height={chartHeight}
            activeIndicators={subIndicators}
            showMA={showMA}
            showEMA={showEMA}
            showBOLL={showBOLL}
            showSAR={showSAR}
            showAVL={showAVL}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.indicatorBar}>
          {OVERLAYS.map((k) => {
            const active = isOverlayActive(k);
            return (
              <Pressable key={k} onPress={() => toggleOverlay(k)} style={[styles.indicatorChip, active ? styles.indicatorChipActive : null]}>
                <Text style={[styles.indicatorText, active ? styles.indicatorTextActive : null]}>{k}</Text>
              </Pressable>
            );
          })}
          <View style={styles.indicatorDivider} />
          {SUB_PANELS.map((k) => {
            const active = subIndicators.includes(k);
            return (
              <Pressable key={k} onPress={() => toggleSubPanel(k)} style={[styles.indicatorChip, active ? styles.indicatorChipActive : null]}>
                <Text style={[styles.indicatorText, active ? styles.indicatorTextActive : null]}>{k}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </ScrollView>

      <Modal
        visible={showMoreSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoreSheet(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowMoreSheet(false)}>
          <Pressable style={styles.sheetCard} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Time period</Text>
            {MORE_ROWS.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.sheetRow}>
                {row.map((iv, idx) => {
                  if (!iv) return <View key={`empty-${idx}`} style={styles.sheetCell} />;
                  const active = iv === interval;
                  return (
                    <Pressable
                      key={iv}
                      style={[styles.sheetCell, styles.sheetCellButton, active ? styles.sheetCellButtonActive : null]}
                      onPress={() => {
                        setChartInterval(iv);
                        setShowMoreSheet(false);
                      }}
                    >
                      <Text style={[styles.sheetCellText, active ? styles.sheetCellTextActive : null]}>{iv}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (palette: typeof AppColors.dark | typeof AppColors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    header: {
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    backButton: {
      width: 34,
      height: 34,
      borderRadius: Radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: {
      color: palette.textMuted,
      fontSize: Typography.size.xl,
      fontFamily: 'Geist-SemiBold',
      marginTop: -2,
    },
    pairButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 4,
      marginRight: 8,
    },
    pairText: {
      color: palette.text,
      fontSize: Typography.size.md + 1,
      fontFamily: 'Geist-Bold',
    },
    dropdownText: {
      color: palette.textMuted,
      marginLeft: 4,
      fontSize: Typography.size.md,
    },
    changeText: {
      fontSize: Typography.size.xs,
      fontFamily: 'Geist-SemiBold',
      marginRight: 8,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 7,
    },
    priceHeader: {
      paddingHorizontal: 14,
      paddingBottom: 8,
    },
    priceMainRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    priceMain: {
      fontSize: 26,
      fontFamily: 'Geist-Bold',
      letterSpacing: -0.3,
    },
    priceApprox: {
      color: palette.textMuted,
      fontSize: Typography.size.xs,
      marginLeft: 8,
      marginBottom: 4,
      fontFamily: 'Geist-Regular',
    },
    candleCountdown: {
      color: withAlpha(palette.text, 0.7),
      fontSize: Typography.size.xs,
      fontFamily: 'Geist-Medium',
      marginTop: 1,
      marginBottom: 2,
    },
    statsRow: {
      flexDirection: 'row',
      marginTop: 8,
    },
    statCell: {
      flex: 1,
      paddingRight: 4,
    },
    statLabel: {
      color: withAlpha(palette.text, 0.45),
      fontSize: 10,
      fontFamily: 'Geist-Regular',
      marginBottom: 2,
    },
    statValue: {
      color: palette.textMuted,
      fontSize: Typography.size.xs,
      fontFamily: 'Geist-SemiBold',
    },
    tabRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingBottom: 6,
    },
    tabItem: {
      marginRight: 16,
    },
    tabText: {
      color: palette.textMuted,
      fontSize: Typography.size.sm,
      fontFamily: 'Geist-Regular',
    },
    tabTextActive: {
      color: palette.text,
      fontFamily: 'Geist-Bold',
    },
    tabIndicator: {
      marginTop: 4,
      height: 2,
      width: 0,
      borderRadius: 1,
      backgroundColor: palette.accent,
    },
    tabIndicatorActive: {
      width: 18,
    },
    newsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    newsIcon: {
      color: palette.textMuted,
      marginRight: 6,
      fontSize: Typography.size.sm,
    },
    newsContent: {
      flex: 1,
    },
    newsText: {
      color: palette.textMuted,
      fontSize: Typography.size.xs,
      fontFamily: 'Geist-Regular',
    },
    newsClose: {
      color: palette.textMuted,
      fontSize: Typography.size.sm,
      paddingHorizontal: 4,
    },
    intervalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    intervalChip: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: Radii.sm,
      marginRight: 2,
    },
    intervalChipActive: {
      backgroundColor: withAlpha(palette.surface, 0.95),
      borderWidth: 1,
      borderColor: palette.border,
    },
    intervalText: {
      color: palette.textMuted,
      fontSize: 13,
      fontFamily: 'Geist-Regular',
    },
    intervalTextActive: {
      color: palette.text,
      fontFamily: 'Geist-Bold',
    },
    moreChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    moreText: {
      color: palette.textMuted,
      fontSize: 13,
      fontFamily: 'Geist-Regular',
    },
    moreCaret: {
      color: palette.textMuted,
      fontSize: 12,
      marginLeft: 2,
    },
    toolsRight: {
      marginLeft: 'auto',
      flexDirection: 'row',
      alignItems: 'center',
    },
    toolIcon: {
      color: palette.textMuted,
      fontSize: Typography.size.md,
      marginHorizontal: 7,
    },
    chartBox: {
      paddingHorizontal: 8,
      paddingTop: 4,
    },
    indicatorBar: {
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 6,
    },
    indicatorChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: Radii.sm,
      borderWidth: 1,
      borderColor: withAlpha(palette.border, 0.7),
      backgroundColor: palette.surface,
    },
    indicatorChipActive: {
      borderColor: palette.accent,
      backgroundColor: withAlpha(palette.accent, 0.16),
    },
    indicatorText: {
      color: palette.textMuted,
      fontSize: 12,
      fontFamily: 'Geist-Medium',
    },
    indicatorTextActive: {
      color: palette.accent,
      fontFamily: 'Geist-Bold',
    },
    indicatorDivider: {
      width: 1,
      height: 20,
      marginHorizontal: 4,
      backgroundColor: withAlpha(palette.border, 0.8),
    },
    sheetBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheetCard: {
      backgroundColor: palette.surface,
      borderTopLeftRadius: Radii.xl,
      borderTopRightRadius: Radii.xl,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 28,
    },
    sheetTitle: {
      color: palette.text,
      fontSize: Typography.size.md,
      fontFamily: 'Geist-Bold',
      marginBottom: 16,
    },
    sheetRow: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    sheetCell: {
      flex: 1,
      marginHorizontal: 4,
    },
    sheetCellButton: {
      paddingVertical: 10,
      borderRadius: Radii.sm,
      borderWidth: 1,
      borderColor: withAlpha(palette.border, 0.6),
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetCellButtonActive: {
      borderColor: palette.accent,
      backgroundColor: withAlpha(palette.accent, 0.12),
    },
    sheetCellText: {
      color: palette.textMuted,
      fontSize: 13,
      fontFamily: 'Geist-Medium',
    },
    sheetCellTextActive: {
      color: palette.accent,
      fontFamily: 'Geist-Bold',
    },
  });

function withAlpha(color: string, alpha: number) {
  if (!color.startsWith('#')) return color;
  const hex =
    color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;
  if (hex.length !== 7) return color;
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const safeAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
}
