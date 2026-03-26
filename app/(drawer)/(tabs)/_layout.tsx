import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { BlurView } from 'expo-blur';

import { HapticTab } from '@/components/haptic-tab';
import HistoryIcon from '@/assets/icons/Tabicons/history.svg';
import HomeIcon from '@/assets/icons/Tabicons/home.svg';
import MarketIcon from '@/assets/icons/Tabicons/market.svg';
import TradeIcon from '@/assets/icons/Tabicons/trade.svg';
import WalletIcon from '@/assets/icons/Tabicons/wallet.svg';
import { AppColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const withAlpha = (color: string, alpha: number) => {
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
};

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';
  const palette = AppColors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? palette.onPrimary : palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <BlurView
            intensity={Platform.OS === 'ios' ? 24 : 24}
            tint={isDark ? 'dark' : 'light'}
            style={{ flex: 1 }}
          />
        ),
        tabBarStyle: {
          backgroundColor: withAlpha(isDark ? palette.backgroundAlt : palette.background, isDark ? 0.86 : 0.92),
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          overflow: 'hidden',
          height: 74,
          paddingTop: 10,
          paddingBottom: 12,
          borderTopWidth: 1,
          borderColor: withAlpha(palette.border, isDark ? 0.55 : 0.45),
          position: 'absolute',
          left: 12,
          right: 12,
          // bottom: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
          fontFamily: 'Geist-Regular',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon width={22} height={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: 'Markets',
          tabBarIcon: ({ color }) => <MarketIcon width={22} height={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          title: 'Trade',
          tabBarIcon: ({ color }) => <TradeIcon width={22} height={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <HistoryIcon width={22} height={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color }) => <WalletIcon width={22} height={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
