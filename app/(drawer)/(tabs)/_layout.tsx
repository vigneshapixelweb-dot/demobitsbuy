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

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3DFFDC',
        tabBarInactiveTintColor: '#75817C',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <BlurView
            intensity={Platform.OS === 'ios' ? 30 : 20}
            tint="dark"
            style={{ flex: 1 }}
          />
        ),
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          overflow: 'hidden',
          height: 74,
          paddingTop: 10,
          paddingBottom: 12,
          borderTopWidth: 0,
          position: 'absolute',
          left: 12,
          right: 12,
          // bottom: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
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
