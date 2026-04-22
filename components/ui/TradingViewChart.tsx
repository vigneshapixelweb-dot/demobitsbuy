import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { AppColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type TradingViewChartProps = {
  symbol: string;
  interval?: string;
  height?: number;
  activeIndicators?: string[];
  showMA?: boolean;
  showEMA?: boolean;
  showBOLL?: boolean;
  showSAR?: boolean;
  showAVL?: boolean;
};

const toBinanceInterval = (interval: string) => {
  const map: Record<string, string> = {
    '1': '1m',
    '1m': '1m',
    '3': '3m',
    '3m': '3m',
    '5': '5m',
    '5m': '5m',
    '15': '15m',
    '15m': '15m',
    '30': '30m',
    '30m': '30m',
    '60': '1h',
    '1h': '1h',
    '120': '2h',
    '2h': '2h',
    '6h': '6h',
    '8h': '8h',
    '12h': '12h',
    '240': '4h',
    '4h': '4h',
    D: '1d',
    '1D': '1d',
    '2D': '3d',
    '3D': '3d',
    '5D': '1w',
    W: '1w',
    '1W': '1w',
    '1M': '1M',
    '3M': '1M',
  };
  return map[interval] || '15m';
};

const toIntervalMs = (binanceInterval: string) => {
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
    '1d': 24 * 60 * 60_000,
    '3d': 3 * 24 * 60 * 60_000,
    '1w': 7 * 24 * 60 * 60_000,
    '1M': 30 * 24 * 60 * 60_000,
  };
  return map[binanceInterval] ?? 15 * 60_000;
};

export function TradingViewChart({
  symbol,
  interval = '1D',
  height = 380,
  activeIndicators = ['VOL', 'RSI', 'MACD'],
  showMA = true,
  showEMA = false,
  showBOLL = true,
  showSAR = false,
  showAVL = false,
}: TradingViewChartProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = AppColors[colorScheme];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cleanSymbol = String(symbol || 'BTCUSDT').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const binanceInterval = toBinanceInterval(interval);
  const intervalMs = toIntervalMs(binanceInterval);

  const cfg = useMemo(
    () => ({
      activeIndicators,
      showMA,
      showEMA,
      showBOLL,
      showSAR,
      showAVL,
      subH: 82,
      colors: {
        bg: palette.surface,
        txt: palette.textMuted,
        gr: 'rgba(120,120,120,0.08)',
        bd: palette.border,
      },
      intervalMs,
    }),
    [activeIndicators, intervalMs, palette.border, palette.surface, palette.textMuted, showAVL, showBOLL, showEMA, showMA, showSAR],
  );

  const html = useMemo(
    () => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: ${palette.surface};
    }
    #root {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: ${palette.surface};
    }
    .panel {
      width: 100%;
      position: relative;
    }
    .sep {
      width: 100%;
      height: 1px;
      background: rgba(120,120,120,0.08);
    }
    .lbl {
      position: absolute;
      top: 4px;
      left: 8px;
      font-size: 10px;
      color: ${palette.textMuted};
      z-index: 10;
      pointer-events: none;
      font-family: Arial, sans-serif;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .chart {
      width: 100%;
      height: 100%;
    }
    .countdown {
      position: absolute;
      right: 8px;
      bottom: 20px;
      z-index: 12;
      font-size: 10px;
      color: #FFFFFF;
      font-family: Arial, sans-serif;
      background: rgb(0, 0, 0);
      border: 1px solid rgb(248, 245, 245);
      border-radius: 6px;
      padding: 2px 6px;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="panel" id="p-main"><div class="lbl" id="l-main"></div><div class="countdown" id="c-timer">--:--</div><div class="chart" id="c-main"></div></div>
    <div class="sep" id="s-vol" style="display:none"></div>
    <div class="panel" id="p-vol" style="display:none"><div class="lbl" id="l-vol"></div><div class="chart" id="c-vol"></div></div>
    <div class="sep" id="s-rsi" style="display:none"></div>
    <div class="panel" id="p-rsi" style="display:none"><div class="lbl" id="l-rsi"></div><div class="chart" id="c-rsi"></div></div>
    <div class="sep" id="s-macd" style="display:none"></div>
    <div class="panel" id="p-macd" style="display:none"><div class="lbl" id="l-macd"></div><div class="chart" id="c-macd"></div></div>
    <div class="sep" id="s-kdj" style="display:none"></div>
    <div class="panel" id="p-kdj" style="display:none"><div class="lbl" id="l-kdj"></div><div class="chart" id="c-kdj"></div></div>
    <div class="sep" id="s-roc" style="display:none"></div>
    <div class="panel" id="p-roc" style="display:none"><div class="lbl" id="l-roc"></div><div class="chart" id="c-roc"></div></div>
    <div class="sep" id="s-cci" style="display:none"></div>
    <div class="panel" id="p-cci" style="display:none"><div class="lbl" id="l-cci"></div><div class="chart" id="c-cci"></div></div>
    <div class="sep" id="s-wr" style="display:none"></div>
    <div class="panel" id="p-wr" style="display:none"><div class="lbl" id="l-wr"></div><div class="chart" id="c-wr"></div></div>
  </div>

  <script src="https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js"></script>
  <script>
  (function() {
    const post = (type, payload) => {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...payload }));
      } catch (_) {}
    };

    const CFG = ${JSON.stringify(cfg)};
    const K = {
      BG: CFG.colors.bg,
      TXT: CFG.colors.txt,
      GR: CFG.colors.gr,
      BD: CFG.colors.bd,
      AXIS_W: 44,
      UP: '#2EBD85',
      DN: '#F6465D',
      UPA: 'rgba(46,189,133,0.65)',
      DNA: 'rgba(246,70,93,0.65)',
    };

    let D = [];
    let ws = null;
    let countdownTicker = null;
    let rafScheduled = false;
    let hasInitialViewport = false;

    let cM, cVol, cRsi, cMacd, cKdj, cRoc, cCci, cWr;
    let sCa, sVol;
    let sMa5, sMa10, sMa20, sE12, sE26, sBU, sBM, sBL, sSar, sAvl;
    let sR6, sR12, sR24, sMH, sMDif, sMDea, sKK, sKD, sKJ, sRoc, sRMa, sCci, sWr;

    const hasSub = (key) => (CFG.activeIndicators || []).includes(key);
    const f2 = (v) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(2) : '--');
    const fk = (v) => {
      const n = Number(v || 0);
      if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
      if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
      return n.toFixed(2);
    };

    const ma = (d, p) => {
      const r = [];
      for (let i = p - 1; i < d.length; i++) {
        let v = 0;
        for (let j = i - p + 1; j <= i; j++) v += d[j].close;
        r.push({ time: d[i].time, value: v / p });
      }
      return r;
    };
    const ema = (d, p) => {
      const k = 2 / (p + 1);
      let e = d[0] ? d[0].close : 0;
      return d.map((x, i) => {
        e = i === 0 ? x.close : x.close * k + e * (1 - k);
        return { time: x.time, value: e };
      });
    };
    const emaLast = (d, p) => {
      if (!d.length) return 0;
      const k = 2 / (p + 1);
      let e = d[0].close;
      for (let i = 1; i < d.length; i++) e = d[i].close * k + e * (1 - k);
      return e;
    };
    const boll = (d, p = 20, k = 2) => {
      const U = [], M = [], L = [];
      for (let i = p - 1; i < d.length; i++) {
        const s = d.slice(i - p + 1, i + 1);
        const m = s.reduce((a, x) => a + x.close, 0) / p;
        const sd = Math.sqrt(s.reduce((a, x) => a + Math.pow(x.close - m, 2), 0) / p);
        U.push({ time: d[i].time, value: m + k * sd });
        M.push({ time: d[i].time, value: m });
        L.push({ time: d[i].time, value: m - k * sd });
      }
      return { U, M, L };
    };
    const sar = (d) => {
      const r = [];
      if (d.length < 2) return r;
      const ST = 0.02, MX = 0.2;
      let bull = true, s = d[0].low, ep = d[0].high, af = ST;
      for (let i = 1; i < d.length; i++) {
        s += af * (ep - s);
        if (bull) {
          if (d[i].low < s) { bull = false; s = ep; ep = d[i].low; af = ST; }
          else {
            if (d[i].high > ep) { ep = d[i].high; af = Math.min(af + ST, MX); }
            s = Math.min(s, d[i - 1].low, i > 1 ? d[i - 2].low : d[i - 1].low);
          }
        } else {
          if (d[i].high > s) { bull = true; s = ep; ep = d[i].high; af = ST; }
          else {
            if (d[i].low < ep) { ep = d[i].low; af = Math.min(af + ST, MX); }
            s = Math.max(s, d[i - 1].high, i > 1 ? d[i - 2].high : d[i - 1].high);
          }
        }
        r.push({ time: d[i].time, value: s });
      }
      return r;
    };
    const avl = (d, p = 20) => {
      const r = [];
      for (let i = p - 1; i < d.length; i++) {
        const v = d.slice(i - p + 1, i + 1).reduce((a, x) => a + x.volume, 0) / p;
        r.push({ time: d[i].time, value: v });
      }
      return r;
    };
    const rsi = (d, p) => {
      const r = [];
      if (d.length <= p) return r;
      let ag = 0, al = 0;
      for (let i = 1; i <= p; i++) {
        const v = d[i].close - d[i - 1].close;
        if (v > 0) ag += v; else al -= v;
      }
      ag /= p; al /= p;
      const f = (g, l) => l < 1e-9 ? 100 : 100 - 100 / (1 + g / l);
      r.push({ time: d[p].time, value: f(ag, al) });
      for (let i = p + 1; i < d.length; i++) {
        const v = d[i].close - d[i - 1].close;
        ag = (ag * (p - 1) + Math.max(0, v)) / p;
        al = (al * (p - 1) + Math.max(0, -v)) / p;
        r.push({ time: d[i].time, value: f(ag, al) });
      }
      return r;
    };
    const macd = (d) => {
      if (!d || d.length < 26) return { dif: [], dea: [], hist: [] };
      const ef = ema(d, 12), es = ema(d, 26);
      const dif = d.slice(25).map((x, i) => ({ time: x.time, value: ef[25 + i].value - es[25 + i].value }));
      const k = 2 / 10;
      let dea = dif[0].value;
      const deaArr = dif.map((x, i) => {
        dea = i === 0 ? x.value : x.value * k + dea * (1 - k);
        return { time: x.time, value: dea };
      });
      const hist = dif.map((x, i) => ({
        time: x.time,
        value: (x.value - deaArr[i].value) * 2,
        color: x.value >= deaArr[i].value ? K.UP : K.DN,
      }));
      return { dif, dea: deaArr, hist };
    };
    const kdj = (d) => {
      const KA = [], DA = [], JA = [];
      let k = 50, dv = 50;
      const n = 9, m = 3;
      for (let i = n - 1; i < d.length; i++) {
        const s = d.slice(i - n + 1, i + 1);
        const hi = Math.max(...s.map((x) => x.high));
        const lo = Math.min(...s.map((x) => x.low));
        const rsv = hi === lo ? 50 : ((d[i].close - lo) / (hi - lo)) * 100;
        k = (k * (m - 1) + rsv) / m;
        dv = (dv * (m - 1) + k) / m;
        const j = 3 * k - 2 * dv;
        KA.push({ time: d[i].time, value: k });
        DA.push({ time: d[i].time, value: dv });
        JA.push({ time: d[i].time, value: j });
      }
      return { K: KA, D: DA, J: JA };
    };
    const roc = (d) => {
      const p = 12, mp = 6;
      const r = [];
      for (let i = p; i < d.length; i++) {
        r.push({ time: d[i].time, value: ((d[i].close - d[i - p].close) / d[i - p].close) * 100 });
      }
      const rm = [];
      for (let i = mp - 1; i < r.length; i++) {
        let v = 0;
        for (let j = i - mp + 1; j <= i; j++) v += r[j].value;
        rm.push({ time: r[i].time, value: v / mp });
      }
      return { roc: r, rocma: rm };
    };
    const cci = (d) => {
      const p = 14, r = [];
      for (let i = p - 1; i < d.length; i++) {
        const s = d.slice(i - p + 1, i + 1);
        const tp = s.map((x) => (x.high + x.low + x.close) / 3);
        const m = tp.reduce((a, v) => a + v, 0) / p;
        const md = tp.reduce((a, v) => a + Math.abs(v - m), 0) / p;
        r.push({ time: d[i].time, value: md < 1e-9 ? 0 : (tp[tp.length - 1] - m) / (0.015 * md) });
      }
      return r;
    };
    const wr = (d) => {
      const p = 14, r = [];
      for (let i = p - 1; i < d.length; i++) {
        const s = d.slice(i - p + 1, i + 1);
        const hi = Math.max(...s.map((x) => x.high));
        const lo = Math.min(...s.map((x) => x.low));
        r.push({ time: d[i].time, value: hi === lo ? -50 : ((hi - d[i].close) / (hi - lo)) * -100 });
      }
      return r;
    };

    const showPanel = (id, visible) => {
      const p = document.getElementById('p-' + id);
      const s = document.getElementById('s-' + id);
      if (!p || !s) return;
      p.style.display = visible ? 'block' : 'none';
      s.style.display = visible ? 'block' : 'none';
    };

    const mkChart = (id, h, margins, hideTime) => {
      const el = document.getElementById(id);
      if (!el) return null;
      el.style.height = h + 'px';
      const c = LightweightCharts.createChart(el, {
        width: window.innerWidth,
        height: h,
        layout: { background: { color: K.BG }, textColor: K.TXT, fontSize: 10 },
        grid: { vertLines: { color: K.GR }, horzLines: { color: K.GR } },
        rightPriceScale: {
          borderColor: K.BD,
          scaleMargins: margins || { top: 0.1, bottom: 0.1 },
          minimumWidth: K.AXIS_W,
        },
        timeScale: {
          borderColor: K.BD,
          timeVisible: true,
          secondsVisible: false,
          visible: !hideTime,
        },
        handleScale: {
          mouseWheel: true,
          pinch: true,
          axisPressedMouseMove: { time: true, price: true },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: false,
        },
      });
      return c;
    };

    // TradingView-like price-axis zoom for mobile touch.
    // Drag up/down near chart edges to zoom price scale in/out.
    const setupPriceAxisTouchZoom = (chart, initialMargins) => {
      if (!chart) return;
      const container = chart.chartElement();
      if (!container) return;

      const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
      let top = (initialMargins && initialMargins.top) || 0.07;
      let bottom = (initialMargins && initialMargins.bottom) || 0.04;
      let active = false;
      let lastY = null;

      const onStart = (e) => {
        if (!e.touches || e.touches.length !== 1) return;
        const t = e.touches[0];
        const rect = container.getBoundingClientRect();
        const localX = t.clientX - rect.left;
        const edgeZone = 80;
        const inLeftAxis = localX <= edgeZone;
        const inRightAxis = localX >= container.clientWidth - edgeZone;
        if (!inLeftAxis && !inRightAxis) return;
        active = true;
        lastY = t.clientY;
        e.preventDefault();
        e.stopPropagation();
      };

      const onMove = (e) => {
        if (!active || lastY === null || !e.touches || e.touches.length !== 1) return;
        const t = e.touches[0];
        const dy = t.clientY - lastY;
        lastY = t.clientY;
        e.preventDefault();
        e.stopPropagation();

        const delta = dy * 0.0015;
        top = clamp(top + delta, 0.01, 0.48);
        bottom = clamp(bottom + delta, 0.01, 0.48);
        chart.priceScale('right').applyOptions({
          scaleMargins: { top, bottom },
        });
      };

      const onEnd = () => {
        active = false;
        lastY = null;
      };

      container.addEventListener('touchstart', onStart, { passive: false });
      container.addEventListener('touchmove', onMove, { passive: false });
      container.addEventListener('touchend', onEnd, { passive: true });
      container.addEventListener('touchcancel', onEnd, { passive: true });
    };

    const ln = (chart, color, width) =>
      chart.addLineSeries({
        color,
        lineWidth: width || 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });

    const syncTS = (a, b) => {
      a.timeScale().subscribeVisibleLogicalRangeChange((r) => {
        if (!r) return;
        try { b.timeScale().setVisibleLogicalRange(r); } catch (_) {}
      });
      b.timeScale().subscribeVisibleLogicalRangeChange((r) => {
        if (!r) return;
        try { a.timeScale().setVisibleLogicalRange(r); } catch (_) {}
      });
    };

    const destroyCharts = () => {
      [cM, cVol, cRsi, cMacd, cKdj, cRoc, cCci, cWr].forEach((c) => {
        try { if (c) c.remove(); } catch (_) {}
      });
      cM = cVol = cRsi = cMacd = cKdj = cRoc = cCci = cWr = null;
      sCa = sVol = sMa5 = sMa10 = sMa20 = sE12 = sE26 = sBU = sBM = sBL = sSar = sAvl = null;
      sR6 = sR12 = sR24 = sMH = sMDif = sMDea = sKK = sKD = sKJ = sRoc = sRMa = sCci = sWr = null;
    };

    const fmtCountdown = (ms) => {
      const total = Math.max(0, Math.floor(ms / 1000));
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      const mm = String(m).padStart(2, '0');
      const ss = String(s).padStart(2, '0');
      if (h > 0) return String(h).padStart(2, '0') + ':' + mm + ':' + ss;
      return mm + ':' + ss;
    };

    const updateCountdown = () => {
      const el = document.getElementById('c-timer');
      if (!el) return;
      if (!D.length) {
        el.textContent = '--:--';
        return;
      }
      const interval = Number(CFG.intervalMs || 0) || 900000;
      const lastOpenMs = Number(D[D.length - 1].time || 0) * 1000;
      const nextCloseMs = lastOpenMs + interval;
      const remaining = nextCloseMs - Date.now();
      el.textContent = fmtCountdown(remaining);
    };

    const buildCharts = () => {
      destroyCharts();
      if (!D.length) return;
      hasInitialViewport = false;

      const subH = CFG.subH || 82;
      const subs = (CFG.activeIndicators || []).length;
      const mainH = Math.max(220, window.innerHeight - subs * (subH + 1));

      cM = mkChart('c-main', mainH, { top: 0.07, bottom: 0.04 }, false);
      if (!cM) return;
      setupPriceAxisTouchZoom(cM, { top: 0.07, bottom: 0.04 });

      sCa = cM.addCandlestickSeries({
        upColor: K.UP,
        downColor: K.DN,
        borderUpColor: K.UP,
        borderDownColor: K.DN,
        wickUpColor: K.UP,
        wickDownColor: K.DN,
      });
      sMa5 = ln(cM, '#F6A623');
      sMa10 = ln(cM, '#E040FB');
      sMa20 = ln(cM, '#00C087');
      sE12 = ln(cM, '#FFD700');
      sE26 = ln(cM, '#00BFFF');
      sBU = cM.addLineSeries({ color: '#60A5FA', lineWidth: 1, lineStyle: 1, priceLineVisible: false, lastValueVisible: false });
      sBM = cM.addLineSeries({ color: 'rgba(255,255,255,0.18)', lineWidth: 1, lineStyle: 1, priceLineVisible: false, lastValueVisible: false });
      sBL = cM.addLineSeries({ color: '#F472B6', lineWidth: 1, lineStyle: 1, priceLineVisible: false, lastValueVisible: false });
      sSar = cM.addLineSeries({
        color: 'rgba(246,166,35,0.85)',
        lineWidth: 0,
        pointMarkersVisible: true,
        pointMarkersRadius: 1.4,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      sAvl = ln(cM, '#00FFCC', 1);

      showPanel('vol', hasSub('VOL'));
      showPanel('rsi', hasSub('RSI'));
      showPanel('macd', hasSub('MACD'));
      showPanel('kdj', hasSub('KDJ'));
      showPanel('roc', hasSub('ROC'));
      showPanel('cci', hasSub('CCI'));
      showPanel('wr', hasSub('WR'));

      if (hasSub('VOL')) {
        cVol = mkChart('c-vol', subH, { top: 0.05, bottom: 0.02 }, true);
        if (cVol) {
          sVol = cVol.addHistogramSeries({ priceScaleId: 'right' });
          syncTS(cM, cVol);
        }
      }
      if (hasSub('RSI')) {
        cRsi = mkChart('c-rsi', subH, undefined, true);
        if (cRsi) {
          sR6 = ln(cRsi, '#F6A623');
          sR12 = ln(cRsi, '#E040FB');
          sR24 = ln(cRsi, '#00C087');
          syncTS(cM, cRsi);
        }
      }
      if (hasSub('MACD')) {
        cMacd = mkChart('c-macd', subH, undefined, true);
        if (cMacd) {
          sMH = cMacd.addHistogramSeries({ priceScaleId: 'right' });
          sMDif = ln(cMacd, '#60A5FA');
          sMDea = ln(cMacd, '#F6A623');
          syncTS(cM, cMacd);
        }
      }
      if (hasSub('KDJ')) {
        cKdj = mkChart('c-kdj', subH, undefined, true);
        if (cKdj) {
          sKK = ln(cKdj, '#F6A623');
          sKD = ln(cKdj, '#E040FB');
          sKJ = ln(cKdj, '#00C087');
          syncTS(cM, cKdj);
        }
      }
      if (hasSub('ROC')) {
        cRoc = mkChart('c-roc', subH, undefined, true);
        if (cRoc) {
          sRoc = ln(cRoc, '#F6A623');
          sRMa = ln(cRoc, '#E040FB');
          syncTS(cM, cRoc);
        }
      }
      if (hasSub('CCI')) {
        cCci = mkChart('c-cci', subH, undefined, true);
        if (cCci) {
          sCci = ln(cCci, '#00C087');
          syncTS(cM, cCci);
        }
      }
      if (hasSub('WR')) {
        cWr = mkChart('c-wr', subH, undefined, true);
        if (cWr) {
          sWr = ln(cWr, '#F472B6');
          syncTS(cM, cWr);
        }
      }
      applySeriesData();
      updateCountdown();
    };

    const applySeriesData = () => {
      if (!D.length || !sCa) return;
      const d = D;
      sCa.setData(d.map((x) => ({ time: x.time, open: x.open, high: x.high, low: x.low, close: x.close })));

      const ma5 = ma(d, 5), ma10 = ma(d, 10), ma20 = ma(d, 20);
      sMa5 && sMa5.setData(ma5);
      sMa10 && sMa10.setData(ma10);
      sMa20 && sMa20.setData(ma20);
      [sMa5, sMa10, sMa20].forEach((s) => s && s.applyOptions({ visible: !!CFG.showMA }));

      const e12 = ema(d, 12), e26 = ema(d, 26);
      sE12 && sE12.setData(e12);
      sE26 && sE26.setData(e26);
      [sE12, sE26].forEach((s) => s && s.applyOptions({ visible: !!CFG.showEMA }));

      const bb = boll(d);
      sBU && sBU.setData(bb.U);
      sBM && sBM.setData(bb.M);
      sBL && sBL.setData(bb.L);
      [sBU, sBM, sBL].forEach((s) => s && s.applyOptions({ visible: !!CFG.showBOLL }));

      const sarData = sar(d);
      sSar && sSar.setData(sarData);
      sSar && sSar.applyOptions({ visible: !!CFG.showSAR });

      const avlData = avl(d);
      sAvl && sAvl.setData(avlData);
      sAvl && sAvl.applyOptions({ visible: !!CFG.showAVL });

      if (sVol) {
        sVol.setData(d.map((x) => ({
          time: x.time,
          value: x.volume,
          color: x.close >= x.open ? K.UPA : K.DNA,
        })));
      }
      if (sR6 && sR12 && sR24) {
        const r6 = rsi(d, 6), r12 = rsi(d, 12), r24 = rsi(d, 24);
        sR6.setData(r6); sR12.setData(r12); sR24.setData(r24);
      }
      if (sMH && sMDif && sMDea) {
        const m = macd(d);
        sMH.setData(m.hist); sMDif.setData(m.dif); sMDea.setData(m.dea);
      }
      if (sKK && sKD && sKJ) {
        const k = kdj(d);
        sKK.setData(k.K); sKD.setData(k.D); sKJ.setData(k.J);
      }
      if (sRoc && sRMa) {
        const r = roc(d);
        sRoc.setData(r.roc); sRMa.setData(r.rocma);
      }
      if (sCci) sCci.setData(cci(d));
      if (sWr) sWr.setData(wr(d));

      const n = d.length;
      const targetRange = { from: Math.max(0, n - 90), to: n + 2 };
      if (!hasInitialViewport) {
        cM.timeScale().setVisibleLogicalRange(targetRange);
        hasInitialViewport = true;
      }

      const lbl = document.getElementById('l-main');
      if (lbl) {
        let text = '';
        if (CFG.showMA && n >= 20) {
          text += 'MA5:' + f2(ma5[ma5.length - 1] && ma5[ma5.length - 1].value) + ' ';
          text += 'MA10:' + f2(ma10[ma10.length - 1] && ma10[ma10.length - 1].value) + ' ';
          text += 'MA20:' + f2(ma20[ma20.length - 1] && ma20[ma20.length - 1].value) + ' ';
        }
        if (CFG.showEMA) {
          text += 'EMA12:' + f2(emaLast(d, 12)) + ' ';
          text += 'EMA26:' + f2(emaLast(d, 26));
        }
        lbl.textContent = text.trim();
      }
      const lv = d[d.length - 1];
      const volLbl = document.getElementById('l-vol');
      if (volLbl && lv) volLbl.textContent = 'VOL: ' + fk(lv.volume);
    };

    const scheduleApply = () => {
      if (rafScheduled) return;
      rafScheduled = true;
      requestAnimationFrame(() => {
        rafScheduled = false;
        applySeriesData();
        updateCountdown();
      });
    };

    const connectSocket = () => {
      try {
        const stream = '${cleanSymbol.toLowerCase()}@kline_${binanceInterval}';
        ws = new WebSocket('wss://stream.binance.com:9443/ws/' + stream);
        ws.onopen = () => post('socket', { connected: true });
        ws.onclose = () => post('socket', { connected: false });
        ws.onerror = () => post('socket', { connected: false });
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            const k = msg && msg.k;
            if (!k) return;
            const c = {
              time: Math.floor(Number(k.t) / 1000),
              open: Number(k.o),
              high: Number(k.h),
              low: Number(k.l),
              close: Number(k.c),
              volume: Number(k.v),
            };
            const last = D[D.length - 1];
            if (last && last.time === c.time) {
              D[D.length - 1] = c;
            } else {
              D.push(c);
              if (D.length > 2000) D.shift();
            }
            scheduleApply();
          } catch (_) {}
        };
      } catch (_) {}
    };

    const boot = async () => {
      try {
        const url = 'https://api.binance.com/api/v3/klines?symbol=${cleanSymbol}&interval=${binanceInterval}&limit=500';
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch klines');
        const rows = await res.json();
        D = rows.map((x) => ({
          time: Math.floor(Number(x[0]) / 1000),
          open: Number(x[1]),
          high: Number(x[2]),
          low: Number(x[3]),
          close: Number(x[4]),
          volume: Number(x[5]),
        }));
        buildCharts();
        if (countdownTicker) clearInterval(countdownTicker);
        countdownTicker = setInterval(updateCountdown, 1000);
        updateCountdown();
        connectSocket();
        post('ready', {});
      } catch (e) {
        post('error', { message: String(e) });
      }
    };

    window.addEventListener('resize', () => {
      buildCharts();
    });

    boot();
  })();
  </script>
</body>
</html>`,
    [binanceInterval, cfg, cleanSymbol, palette.surface, palette.textMuted],
  );

  return (
    <View style={[styles.wrapper, { height, backgroundColor: palette.surface, borderColor: palette.border }]}>
      {loading ? (
        <View style={styles.overlay}>
          <ActivityIndicator size="small" color={palette.accent} />
          <Text style={[styles.overlayText, { color: palette.textMuted }]}>Loading chart...</Text>
        </View>
      ) : null}
      {error ? (
        <View style={styles.overlay}>
          <Text style={[styles.errorTitle, { color: palette.text }]}>Chart Error</Text>
          <Text style={[styles.overlayText, { color: palette.textMuted }]}>{error}</Text>
        </View>
      ) : null}
      <WebView
        key={`${cleanSymbol}-${binanceInterval}-${colorScheme}-${activeIndicators.join(',')}-${showMA}-${showEMA}-${showBOLL}-${showSAR}-${showAVL}`}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data || '{}');
            if (msg.type === 'ready') {
              setLoading(false);
              setError('');
            } else if (msg.type === 'error') {
              setLoading(false);
              setError(msg.message || 'Unable to load chart');
            }
          } catch {
            setLoading(false);
          }
        }}
        onLoadStart={() => {
          setLoading(true);
          setError('');
        }}
        onError={() => {
          setLoading(false);
          setError('WebView failed to load');
        }}
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  overlayText: {
    fontSize: 12,
    fontFamily: 'Geist-Regular',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 14,
    fontFamily: 'Geist-SemiBold',
  },
});
