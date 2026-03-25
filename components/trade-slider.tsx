import { useCallback, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, Text, View } from "react-native";

type TradeSliderProps = {
  isDark: boolean;
  accentColor: string;
  textMuted: string;
};

export function TradeSlider({ isDark, accentColor, textMuted }: TradeSliderProps) {
  const trackWidth = useRef(0);
  const pctAnim = useRef(new Animated.Value(0)).current;
  const [pct, setPct] = useState(0);

  const pctFromX = useCallback((x: number) => {
    const w = trackWidth.current;
    if (!w) return 0;
    return (x / w) * 100;
  }, []);

  const setPercent = useCallback(
    (raw: number) => {
      const clamped = Math.max(0, Math.min(100, raw));
      pctAnim.setValue(clamped);
      setPct(clamped);
    },
    [pctAnim]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.locationX;
        setPercent(pctFromX(x));
      },
      onPanResponderMove: (e) => {
        const x = e.nativeEvent.locationX;
        setPercent(pctFromX(x));
      },
    })
  ).current;

  const thumbLeft = pctAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  const fillWidth = pctAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.sliderWrap}>
      <View style={styles.sliderTouchArea} {...panResponder.panHandlers}>
        <View
          style={[styles.sliderTrack, { backgroundColor: isDark ? "#275049" : "#D6D6D6" }]}
          onLayout={(e) => {
            trackWidth.current = e.nativeEvent.layout.width;
          }}
        >
          <Animated.View
            style={[styles.sliderFill, { width: fillWidth, backgroundColor: accentColor }]}
            pointerEvents="none"
          />

          <Animated.View style={[styles.sliderThumbWrap, { left: thumbLeft }]} pointerEvents="none">
            <Text style={[styles.sliderValueText, { color: textMuted }]}>
              {Math.round(pct)}%
            </Text>
            <View style={[styles.sliderIndicatorDot, { backgroundColor: accentColor }]} />
            <View
              style={[
                styles.sliderThumb,
                {
                  borderColor: accentColor,
                  backgroundColor: isDark ? "#020B09" : "#FFFFFF",
                },
              ]}
            />
          </Animated.View>
        </View>
      </View>

     
    </View>
  );
}

const styles = StyleSheet.create({
  sliderWrap: {
    marginTop: 4,
    marginBottom: 2,
  },
  sliderTouchArea: {
    height: 28,
    justifyContent: "center",
  },
  sliderTrack: {
    height: 2,
    borderRadius: 999,
    position: "relative",
    marginHorizontal: 12,
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  sliderThumbWrap: {
    position: "absolute",
    top: -22,
    marginLeft: -8,
    alignItems: "center",
  },
  sliderValueText: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  sliderIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 3,
  },
  sliderThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  sliderRangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginHorizontal: 12,
  },
  sliderRangeText: { fontSize: 9, fontWeight: "500" },
});
