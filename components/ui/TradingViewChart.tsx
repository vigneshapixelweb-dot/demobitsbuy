import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { AppColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type TradingViewChartProps = {
  symbol: string;
  interval?: string;
  height?: number;
};

export function TradingViewChart({
  symbol,
  interval = '15',
  height = 320,
}: TradingViewChartProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = AppColors[colorScheme];
  const isDark = colorScheme === 'dark';

  const cleanSymbol = String(symbol || 'BTCUSDT').replace(/[^A-Z0-9]/g, '');
  const tvSymbol = `BYBIT:${cleanSymbol}.P`;

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: ${palette.surface}; }
      #tv { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="tv"></div>
    <script src="https://s3.tradingview.com/tv.js"></script>
    <script>
      new TradingView.widget({
        autosize: true,
        symbol: "${tvSymbol}",
        interval: "${interval}",
        timezone: "Etc/UTC",
        theme: "${isDark ? 'dark' : 'light'}",
        style: "1",
        locale: "en",
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        allow_symbol_change: false,
        container_id: "tv",
        studies: []
      });
    </script>
  </body>
</html>`;

  return (
    <View style={[styles.wrapper, { height, backgroundColor: palette.surface, borderColor: palette.border }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
