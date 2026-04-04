import { Drawer } from "expo-router/drawer";
import { useRouter, usePathname } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { DrawerContentScrollView, type DrawerContentComponentProps } from "@react-navigation/drawer";
import { SvgUri } from "react-native-svg";

import CheckIcon from "@/assets/icons/check.svg";
import HistoryDark from "@/assets/icons/Drawer/History_dark.svg";
import HistoryLight from "@/assets/icons/Drawer/History_light.svg";
import HomeDark from "@/assets/icons/Drawer/home_dark.svg";
import HomeLight from "@/assets/icons/Drawer/home_light.svg";
import InternalDark from "@/assets/icons/Drawer/internal_dark.svg";
import InternalLight from "@/assets/icons/Drawer/internal_light.svg";
import KycDark from "@/assets/icons/Drawer/kyc_dark.svg";
import KycLight from "@/assets/icons/Drawer/kyc_light.svg";
import LogoutDark from "@/assets/icons/Drawer/logout_dark.svg";
import LogoutLight from "@/assets/icons/Drawer/logout_light.svg";
import ProfileDark from "@/assets/icons/Drawer/profile_dark.svg";
import ProfileLight from "@/assets/icons/Drawer/profile_light.svg";
import SecurityDark from "@/assets/icons/Drawer/security_dark.svg";
import SecurityLight from "@/assets/icons/Drawer/security_light.svg";
import SupportDark from "@/assets/icons/Drawer/suppot_dark.svg";
import SupportLight from "@/assets/icons/Drawer/support_light.svg";
import TradeDark from "@/assets/icons/Drawer/trade_dark.svg";
import TradeLight from "@/assets/icons/Drawer/trade_light.svg";
import WhitelistDark from "@/assets/icons/Drawer/whitelist withdraw_dark.svg";
import WhitelistLight from "@/assets/icons/Drawer/whitelist withdraw_light.svg";
import MarketIcon from "@/assets/icons/Tabicons/market.svg";
import { Radii } from "@/constants/radii";
import { Spacing } from "@/constants/spacing";
import { AppColors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/auth-store";

const toGradient = (colors: readonly string[]) => colors as [string, string, ...string[]];

type DrawerItem = {
  id: string;
  label: string;
  route?: string;
  match?: string[];
  iconDark?: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  iconLight?: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  iconColor?: boolean;
  action?: () => void;
};

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";
  const palette = AppColors[colorScheme];
  const token = useAuthStore((state) => state.token);
  const profile = useAuthStore((state) => state.profile);
  const email = useAuthStore((state) => state.email);
  const refreshUserDetails = useAuthStore((state) => state.refreshUserDetails);

  useEffect(() => {
    if (!token) return;
    refreshUserDetails();
  }, [token, refreshUserDetails]);

  const items: DrawerItem[] = [
    {
      id: "home",
      label: "Home",
      route: "/(drawer)/(tabs)",
      match: ["/", "/index"],
      iconDark: HomeDark,
      iconLight: HomeLight,
    },
    {
      id: "profile",
      label: "Profile",
      route: "/(drawer)/profile",
      match: ["/profile"],
      iconDark: ProfileDark,
      iconLight: ProfileLight,
    },
    {
      id: "markets",
      label: "Markets",
      route: "/(drawer)/(tabs)/market",
      match: ["/market"],
      iconColor: true,
      iconDark: MarketIcon,
      iconLight: MarketIcon,
    },
    {
      id: "trade",
      label: "Trade",
      route: "/(drawer)/(tabs)/trade",
      match: ["/trade"],
      iconDark: TradeDark,
      iconLight: TradeLight,
    },
    {
      id: "whitelist",
      label: "Whitelist Withdraw",
      route: "/(stack)/withdraw",
      match: ["/withdraw"],
      iconDark: WhitelistDark,
      iconLight: WhitelistLight,
    },
    {
      id: "internal",
      label: "Internal Bank Transfer",
      route: "/(stack)/transfer",
      match: ["/transfer"],
      iconDark: InternalDark,
      iconLight: InternalLight,
    },
    {
      id: "history",
      label: "History",
      route: "/(drawer)/(tabs)/history",
      match: ["/history"],
      iconDark: HistoryDark,
      iconLight: HistoryLight,
    },
    {
      id: "security",
      label: "Security",
      route: "/(drawer)/security",
      match: ["/security"],
      iconDark: SecurityDark,
      iconLight: SecurityLight,
    },
    {
      id: "kyc",
      label: "KYC Verification",
      route: "/(drawer)/verifyaccount",
      match: ["/verifyaccount"],
      iconDark: KycDark,
      iconLight: KycLight,
    },
    {
      id: "support",
      label: "Support",
      route: "/(drawer)/support",
      match: ["/support"],
      iconDark: SupportDark,
      iconLight: SupportLight,
    },
  ];

  const logOutItem: DrawerItem = {
    id: "logout",
    label: "Log out",
    iconDark: LogoutDark,
    iconLight: LogoutLight,
    action: () => {
      props.navigation.closeDrawer();
      router.replace("/(auth)/login");
    },
  };

  const pageBackground = isDark ? "#000505" : "#FFFFFF";
  const textPrimary = isDark ? palette.onPrimary : palette.text;
  const textMuted = palette.textMuted;
  const accent = palette.primary;
  const subtleGlow = toGradient(["rgba(255, 255, 255, 0.04)", "rgba(102, 102, 102, 0)"]);
  const displayName =
    profile?.fullName ||
    profile?.nickname ||
    profile?.username ||
    email ||
    "User";
  const displayEmail = profile?.email || email || "—";
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "U";
  const showVerifiedBadge = profile?.isVerified === true;
  const avatarUri = profile?.avatarUrl ?? null;
  const isSvgAvatar = avatarUri ? avatarUri.toLowerCase().includes(".svg") : false;

  useEffect(() => {
    if (!avatarUri || isSvgAvatar) return;
    Image.prefetch(avatarUri).catch(() => {});
  }, [avatarUri, isSvgAvatar]);

  const isRouteActive = (item: DrawerItem) => {
    if (!item.match || !pathname) return false;
    if (item.id === "home") {
      return pathname === "/" || pathname.endsWith("/index");
    }
    return item.match.some((segment) => pathname.includes(segment));
  };

  const handleNavigate = (item: DrawerItem) => {
    if (item.action) {
      item.action();
      return;
    }
    if (!item.route) return;
    if (item.id === "home") {
      props.navigation.closeDrawer();
      router.replace(item.route);
      return;
    }
    props.navigation.closeDrawer();
    router.push(item.route);
  };

  return (
    <View style={[styles.drawerRoot, { backgroundColor: pageBackground }]}
    >
      {isDark ? (
        <View pointerEvents="none" style={styles.topGlow}>
          <LinearGradient colors={subtleGlow} style={StyleSheet.absoluteFillObject} />
        </View>
      ) : null}

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileRow}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatarRing, { backgroundColor: accent }]}>
              {avatarUri ? (
                isSvgAvatar ? (
                  <SvgUri uri={avatarUri} width={56} height={56} />
                ) : (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                )
              ) : (
                <Text style={styles.avatarInitial}>{avatarInitial}</Text>
              )}
            </View>
          </View>
          <View style={styles.profileTextWrap}>
            <View style={styles.profileNameRow}>
              <Text style={[styles.profileName, { color: textPrimary }]}
              >
                {displayName}
              </Text>
              {showVerifiedBadge ? (
                <View style={[styles.verifyBadge, { backgroundColor: accent }]}>
                  <CheckIcon width={12} height={12} color={palette.onPrimary} />
                </View>
              ) : null}
            </View>
            <Text style={[styles.profileEmail, { color: textMuted }]}
            >
              {displayEmail}
            </Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {items.map((item) => {
            const active = isRouteActive(item);
            const Icon = item.iconColor
              ? (isDark ? item.iconDark : item.iconLight) ?? item.iconDark
              : active
                ? item.iconDark ?? item.iconLight
                : (isDark ? item.iconDark : item.iconLight) ?? item.iconDark;
            return (
              <Pressable
                key={item.id}
                onPress={() => handleNavigate(item)}
                style={[
                  styles.menuItem,
                  active && { backgroundColor: accent },
                ]}
              >
                {Icon ? (
                  <Icon
                    width={24}
                    height={24}
                    color={
                      item.iconColor
                        ? active
                          ? palette.onPrimary
                          : textPrimary
                        : undefined
                    }
                  />
                ) : null}
                <Text
                  style={[
                    styles.menuLabel,
                    { color: active ? palette.onPrimary : textPrimary },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.logoutSection}>
          <Pressable
            onPress={() => handleNavigate(logOutItem)}
            style={styles.menuItem}
          >
            {logOutItem.iconDark ? (
              React.createElement(isDark ? logOutItem.iconDark : logOutItem.iconLight!, {
                width: 24,
                height: 24,
              })
            ) : null}
            <Text style={[styles.menuLabel, { color: textPrimary }]}
            >
              {logOutItem.label}
            </Text>
          </Pressable>
        </View>
      </DrawerContentScrollView>
    </View>
  );
}

export default function DrawerLayout() {
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerPosition: "right",
        overlayColor: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.25)",
        drawerStyle: {
          backgroundColor: isDark ? "#000505" : "#FFFFFF",
          width: 310,
        },
      }}
    >
      <Drawer.Screen name="(tabs)" options={{ title: "Home" }} />
      <Drawer.Screen name="profile" options={{ title: "Profile" }} />
      <Drawer.Screen name="security" options={{ title: "Security" }} />
      <Drawer.Screen name="account-activity" options={{ title: "Account Activity" }} />
      <Drawer.Screen name="chat" options={{ title: "Chat" }} />
      <Drawer.Screen name="verifyaccount" options={{ title: "Verify Account" }} />
      <Drawer.Screen name="kyc-verification" options={{ title: "KYC Verification" }} />
      <Drawer.Screen name="support" options={{ title: "Support" }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerRoot: {
    flex: 1,
  },
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl+10,
    paddingBottom: Spacing.xxl,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontFamily: "Geist-Bold",
    fontSize: Typography.size.lg,
    color: "#FFFFFF",
  },
  profileTextWrap: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 4,
  },
  profileName: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.lg,
    lineHeight: Typography.line.lg,
  },
  verifyBadge: {
    width: 18,
    height: 18,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  profileEmail: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  menuSection: {
    gap: Spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.lg,
  },
  menuLabel: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  logoutSection: {
    marginTop: Spacing.xxxl+50,
    
  },
});
