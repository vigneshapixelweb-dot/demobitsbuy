import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { Platform } from 'react-native';
import HistoryIcon from '@/assets/icons/Tabicons/history.svg';
import HomeIcon from '@/assets/icons/Tabicons/home.svg';
import MarketIcon from '@/assets/icons/Tabicons/market.svg';
import TradeIcon from '@/assets/icons/Tabicons/trade.svg';
import WalletIcon from '@/assets/icons/Tabicons/wallet.svg';
import HistoryPng from '@/assets/icons/Tabicons/history.png';
import HomePng from '@/assets/icons/Tabicons/home.png';
import MarketPng from '@/assets/icons/Tabicons/market.png';
import TradePng from '@/assets/icons/Tabicons/trade.png';
import WalletPng from '@/assets/icons/Tabicons/wallet.png';
import { HapticTab } from '@/components/haptic-tab';
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
  const selectedColor = isDark ? palette.accent : palette.primary;
  const isIOS = Platform.OS === 'ios';
  const iconSize = 22;
  const renderSvgIcon = (
    IconComp: React.ComponentType<{ width?: number; height?: number; color?: string }>,
    color: string,
  ) => <IconComp width={iconSize} height={iconSize} color={color} />;
  const makePng = (img: number) => ({ default: img, selected: img });

  if (!isIOS) {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarActiveTintColor: selectedColor,
          tabBarInactiveTintColor: palette.textMuted,
          tabBarStyle: {
            backgroundColor: withAlpha(isDark ? palette.backgroundAlt : palette.background, isDark ? 0.96 : 0.98),
            borderTopColor: palette.border,
          },
          tabBarLabelStyle: { fontSize: 12, fontFamily: 'Geist-Regular' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => renderSvgIcon(HomeIcon, color),
          }}
        />
        <Tabs.Screen
          name="market"
          options={{
            title: 'Markets',
            tabBarIcon: ({ color }) => renderSvgIcon(MarketIcon, color),
          }}
        />
        <Tabs.Screen
          name="trade"
          options={{
            title: 'Trade',
            tabBarIcon: ({ color }) => renderSvgIcon(TradeIcon, color),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => renderSvgIcon(HistoryIcon, color),
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: 'Wallet',
            tabBarIcon: ({ color }) => renderSvgIcon(WalletIcon, color),
          }}
        />
      </Tabs>
    );
  }

  return (
    <NativeTabs 
      backgroundColor={withAlpha(isDark ? palette.backgroundAlt : palette.background, isDark ? 0.86 : 0.92)}
      iconColor={{ default: palette.textMuted, selected: selectedColor }}
      labelStyle={{
        default: { fontSize: 12, fontFamily: 'Geist-Regular', color: palette.textMuted },
        selected: { fontSize: 12, fontFamily: 'Geist-Regular', color: selectedColor },
      }}
      indicatorColor={palette.accent}
      // blurEffect={isDark ? 'dark' : 'light'}
    >
      <NativeTabs.Trigger name="index">
        <Icon src={makePng(HomePng)} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="market">
        <Icon src={makePng(MarketPng)} />
        <Label>Markets</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="trade">
        <Icon src={makePng(TradePng)} />
        <Label>Trade</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <Icon src={makePng(HistoryPng)} />
        <Label>History</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="wallet">
        <Icon src={makePng(WalletPng)} />
        <Label>Wallet</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
