import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  snapPct?: number; // 0.65 -> 65% of screen height
  children: React.ReactNode;
};

export default function BottomSheet({ isOpen, onClose, snapPct = 0.65, children }: Props) {
  const { height } = Dimensions.get('window');
  const sheetH = Math.round(height * snapPct);
  const translateY = useRef(new Animated.Value(height)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const colorScheme = useColorScheme() ?? 'dark';
  const palette = AppColors[colorScheme];
  const sheetBg = palette.surface;
  const border = palette.border;
  const overlay = colorScheme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.35)';
  const handleColor = palette.textMuted;

  const getOpenY = () => Math.max(0, height - sheetH - keyboardHeight);

  const animateOpen = () =>
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: getOpenY(),
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

  const animateClose = (done?: () => void) =>
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => done?.());

  const pan = useRef(new Animated.Value(0)).current;
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, g) => {
          const dy = Math.max(0, g.dy);
          pan.setValue(dy);
          translateY.setValue(getOpenY() + dy);
          backdrop.setValue(1 - Math.min(1, (dy / sheetH) * 1.2));
        },
        onPanResponderRelease: (_, g) => {
          const shouldClose = g.vy > 1.2 || g.dy > sheetH * 0.35;
          if (shouldClose) {
            animateClose(onClose);
          } else {
            animateOpen();
          }
          pan.setValue(0);
        },
      }),
    [backdrop, height, onClose, pan, sheetH, translateY, keyboardHeight]
  );

  useEffect(() => {
    if (isOpen) {
      translateY.setValue(height);
      animateOpen();
    } else {
      animateClose();
    }
  }, [height, isOpen, sheetH, translateY, keyboardHeight]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      Keyboard.dismiss();
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: overlay, opacity: backdrop, zIndex: 1000 },
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            height: sheetH,
            transform: [{ translateY }],
            backgroundColor: sheetBg,
            borderColor: border,
            zIndex: 1001,
            elevation: 20,
          },
        ]}
      >
        {/* Handle */}
        <View {...panResponder.panHandlers} style={styles.handleWrap}>
          <View style={[styles.handle, { backgroundColor: handleColor }]} />
        </View>

        {children}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  handleWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 6 },
  handle: { width: 44, height: 5, borderRadius: 999 },
});
