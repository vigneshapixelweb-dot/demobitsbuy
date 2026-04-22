import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'chart_models.dart';

// ─── height constants ─────────────────────────────────────────────────────────
const double kSubPanelHeight = 82.0; // each indicator sub-panel (px)
const double kMainChartMinH = 220.0; // minimum main chart height

@immutable
class ChartTheme {
  final Color bg;
  final Color text;
  final Color grid;
  final Color border;
  final Color separator;

  const ChartTheme({
    required this.bg,
    required this.text,
    required this.grid,
    required this.border,
    required this.separator,
  });

  factory ChartTheme.fromTheme(ThemeData theme) {
    final scheme = theme.colorScheme;
    return ChartTheme(
      bg: scheme.surface,
      text: scheme.onSurface.withOpacity(0.65),
      grid: scheme.onSurface.withOpacity(0.06),
      border: scheme.onSurface.withOpacity(0.12),
      separator: scheme.onSurface.withOpacity(0.08),
    );
  }

  Map<String, String> toJs() => {
    'bg': _rgba(bg),
    'txt': _rgba(text),
    'gr': _rgba(grid),
    'bd': _rgba(border),
    'sep': _rgba(separator),
  };

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is ChartTheme &&
            bg == other.bg &&
            text == other.text &&
            grid == other.grid &&
            border == other.border &&
            separator == other.separator;
  }

  @override
  int get hashCode => Object.hash(bg, text, grid, border, separator);
}

String _rgba(Color c) {
  final a = (c.alpha / 255).toStringAsFixed(3);
  return 'rgba(${c.red},${c.green},${c.blue},$a)';
}

// ─────────────────────────────────────────────────────────────────────────────
// TradingChartController
//
// Owned by the PARENT screen. Lets the screen push live WebSocket ticks
// DIRECTLY to JS — bypassing setState / didUpdateWidget entirely.
//
// Why this matters:
//   - Non-final ticks (in-progress candle) must not trigger a Flutter rebuild
//     (that would cause flickering and missed frames).
//   - didUpdateWidget comparison had race-condition edge cases where ticks
//     arrived before _chartBuilt = true and were silently dropped.
//   - Direct JS call is O(1) with zero Flutter overhead.
// ─────────────────────────────────────────────────────────────────────────────
class TradingChartController {
  _TradingChartWidgetState? _state;

  void _attach(_TradingChartWidgetState s) => _state = s;
  void _detach() => _state = null;

  bool get isReady => _state?._chartBuilt ?? false;

  /// Push a live in-progress tick straight to the JS series.update() call.
  /// Call this from the WebSocket callback WITHOUT going through setState.
  void pushTick(CandleData c) => _state?._directTick(c);
}

// ─────────────────────────────────────────────────────────────────────────────
// ChartGestureRecognizer
// Custom gesture recognizer that allows:
// 1. Horizontal panning on the chart.
// 2. Pinch to zoom (multi-touch).
// 3. Vertical dragging on the price axis (rightmost 62px).
// 4. Tap and long-press for crosshair.
// 5. BUT rejects 1-finger vertical drags on the main chart, letting the
//    parent SingleChildScrollView scroll the page.
// ─────────────────────────────────────────────────────────────────────────────
class ChartGestureRecognizer extends OneSequenceGestureRecognizer {
  final double Function() getWidth;
  int _pointerCount = 0;
  Offset? _startPosition;
  bool _resolved = false;
  Timer? _longPressTimer;
  // Tuned thresholds to make horizontal chart pan feel immediate while
  // still allowing vertical page scroll and price-scale drag.
  static const double _axisHitWidth = 80.0;
  static const double _horizSlop = 2.0;
  static const double _vertSlop = 4.0;
  static const double _horizBias = 0.75; // allow slight vertical jitter

  ChartGestureRecognizer({required this.getWidth});

  @override
  String get debugDescription => 'chart_gesture';

  @override
  void addAllowedPointer(PointerDownEvent event) {
    startTrackingPointer(event.pointer);
    _pointerCount++;
    if (_pointerCount == 1) {
      _startPosition = event.position;
      _resolved = false;

      // If tapping on the price scale (rightmost area), always accept to allow scaling
      if (event.localPosition.dx > getWidth() - _axisHitWidth) {
        resolve(GestureDisposition.accepted);
        _resolved = true;
      } else {
        _longPressTimer?.cancel();
        _longPressTimer = Timer(const Duration(milliseconds: 200), () {
          if (!_resolved) {
            resolve(GestureDisposition.accepted);
            _resolved = true;
          }
        });
      }
    } else if (_pointerCount > 1 && !_resolved) {
      // Pinch to zoom: accept immediately
      _longPressTimer?.cancel();
      resolve(GestureDisposition.accepted);
      _resolved = true;
    }
  }

  @override
  void handleEvent(PointerEvent event) {
    if (event is PointerMoveEvent) {
      if (_pointerCount == 1 && _startPosition != null) {
        // If we already accepted this gesture (e.g. from tapping the price axis),
        // we do not need to check thresholds or reject vertical pans.
        if (_resolved) return;

        final dx = (event.position.dx - _startPosition!.dx).abs();
        final dy = (event.position.dy - _startPosition!.dy).abs();
        if (dx > _horizSlop && dx > dy * _horizBias) {
          // Horizontal panning: accept quickly even with minor vertical jitter.
          _longPressTimer?.cancel();
          resolve(GestureDisposition.accepted);
          _resolved = true;
          return;
        }
        if (dy > _vertSlop && dy > dx * (1 / _horizBias)) {
          // Vertical panning: reject (let parent ScrollView scroll the page).
          _longPressTimer?.cancel();
          resolve(GestureDisposition.rejected);
          _resolved = true;
        }
      }
    } else if (event is PointerUpEvent || event is PointerCancelEvent) {
      _pointerCount--;
      if (!_resolved) {
        _longPressTimer?.cancel();
        if (event is PointerUpEvent) {
          resolve(GestureDisposition.accepted); // Tap
        } else {
          resolve(GestureDisposition.rejected); // Cancelled before threshold
        }
        _resolved = true;
      }
      stopTrackingPointer(event.pointer);
      if (_pointerCount == 0) {
        _startPosition = null;
        _resolved = false;
      }
    }
  }

  @override
  void didStopTrackingLastPointer(int pointer) {
    _longPressTimer?.cancel();
    _pointerCount = 0;
    _startPosition = null;
    _resolved = false;
  }

  @override
  void dispose() {
    _longPressTimer?.cancel();
    super.dispose();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TradingChartWidget
// ─────────────────────────────────────────────────────────────────────────────
class TradingChartWidget extends StatefulWidget {
  /// Historical + finalized candles (from REST + confirmed WS finals).
  final List<CandleData> candles;

  /// Controller used for direct O(1) live tick injection.
  final TradingChartController controller;

  /// Sub-panel indicator toggles.
  final Set<String> activeIndicators;

  /// Overlay toggles.
  final bool showMA, showEMA, showBOLL, showSAR, showAVL;

  final String interval, symbol;
  final ChartTheme theme;

  const TradingChartWidget({
    super.key,
    required this.candles,
    required this.controller,
    required this.activeIndicators,
    required this.showMA,
    required this.showEMA,
    required this.showBOLL,
    required this.showSAR,
    required this.showAVL,
    required this.interval,
    required this.symbol,
    required this.theme,
  });

  @override
  State<TradingChartWidget> createState() => _TradingChartWidgetState();
}

class _TradingChartWidgetState extends State<TradingChartWidget> {
  late final WebViewController _ctrl;
  bool _libReady = false;
  bool _chartBuilt = false;
  bool _showLoader = true;
  CandleData? _queuedTick;

  double _chartWidth = 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _chartWidth = MediaQuery.of(context).size.width;
  }

  // Use our custom recognizer to allow horizontal chart pan and pinch zoom,
  // but let vertical drags pass through to the parent ScrollView.
  late final _gestureRecognizers = <Factory<OneSequenceGestureRecognizer>>{
    Factory<ChartGestureRecognizer>(
      () => ChartGestureRecognizer(getWidth: () => _chartWidth),
    ),
  };

  @override
  void initState() {
    super.initState();
    widget.controller._attach(this);

    _ctrl = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(widget.theme.bg)
      ..addJavaScriptChannel(
        'CB',
        onMessageReceived: (m) {
          switch (m.message) {
            case 'rdy':
              // CDN <script onload> fired — library is guaranteed to be defined.
              _libReady = true;
              _tryInject();
              break;
            case 'ok':
              // JS build() completed — hide loader.
              _chartBuilt = true;
              if (_queuedTick != null) {
                final q = _queuedTick!;
                _queuedTick = null;
                _ctrl.runJavaScript('window.tick(${jsonEncode(q.toJson())})');
              }
              if (mounted) setState(() => _showLoader = false);
              break;
          }
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(onPageFinished: (_) => _tryInject()),
      )
      ..loadHtmlString(_buildHtml());
  }

  @override
  void dispose() {
    widget.controller._detach();
    super.dispose();
  }

  // ── initial data injection ────────────────────────────────────────────────
  void _tryInject() {
    if (!_libReady || widget.candles.isEmpty) return;
    final data = jsonEncode(widget.candles.map((c) => c.toJson()).toList());
    _ctrl.runJavaScript('window.init($data,${_cfg()})');
  }

  // ── LIVE TICK: direct JS call, zero Flutter overhead ─────────────────────
  void _directTick(CandleData c) {
    if (!_chartBuilt) {
      _queuedTick = c; // chart not ready yet — buffer last tick
      return;
    }
    _ctrl.runJavaScript('window.tick(${jsonEncode(c.toJson())})');
  }

  // ── prop-change handler (interval/symbol/indicator toggles) ──────────────
  @override
  void didUpdateWidget(TradingChartWidget old) {
    super.didUpdateWidget(old);
    if (old.theme != widget.theme) {
      _ctrl.setBackgroundColor(widget.theme.bg);
    }
    if (!_libReady) return;

    // Dataset changed (new interval selected, or final candle appended).
    if (_candlesChanged(old.candles, widget.candles)) {
      if (widget.candles.isEmpty) return;
      final data = jsonEncode(widget.candles.map((c) => c.toJson()).toList());
      if (!_chartBuilt) {
        _ctrl.runJavaScript('window.init($data,${_cfg()})');
      } else {
        _chartBuilt = false;
        _ctrl.runJavaScript('window.reload($data,${_cfg()})');
      }
      return;
    }

    // Indicator / overlay config changed.
    final cfgChanged =
        !_setsEqual(old.activeIndicators, widget.activeIndicators) ||
        old.showMA != widget.showMA ||
        old.showEMA != widget.showEMA ||
        old.showBOLL != widget.showBOLL ||
        old.showSAR != widget.showSAR ||
        old.showAVL != widget.showAVL ||
        old.theme != widget.theme;

    if (cfgChanged && _chartBuilt) {
      _ctrl.runJavaScript('window.cfg(${_cfg()})');
    }
  }

  bool _candlesChanged(List<CandleData> a, List<CandleData> b) {
    if (a.length != b.length) return true;
    if (a.isEmpty) return false;
    return a.first.time != b.first.time || a.last.time != b.last.time;
  }

  bool _setsEqual(Set<String> a, Set<String> b) =>
      a.length == b.length && a.containsAll(b);

  String _cfg() => jsonEncode({
    'showMA': widget.showMA,
    'showEMA': widget.showEMA,
    'showBOLL': widget.showBOLL,
    'showSAR': widget.showSAR,
    'showAVL': widget.showAVL,
    'showVOL': widget.activeIndicators.contains('VOL'),
    'showMACD': widget.activeIndicators.contains('MACD'),
    'showRSI': widget.activeIndicators.contains('RSI'),
    'showKDJ': widget.activeIndicators.contains('KDJ'),
    'showROC': widget.activeIndicators.contains('ROC'),
    'showCCI': widget.activeIndicators.contains('CCI'),
    'showWR': widget.activeIndicators.contains('WR'),
    'subH': kSubPanelHeight.toInt(),
    'colors': widget.theme.toJs(),
  });

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      _chartWidth = constraints.maxWidth;
      return Stack(
        children: [
          // gestureRecognizers is the ONLY way to make a WebView interactive
          // when it is a descendant of any Flutter scroll/gesture widget.
          WebViewWidget(
            controller: _ctrl,
            gestureRecognizers: _gestureRecognizers,
          ),
          if (_showLoader)
            Container(
              color: widget.theme.bg,
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(
                      color: Color(0xFF00C087),
                      strokeWidth: 2,
                    ),
                    SizedBox(height: 10),
                    Text(
                      'Loading chart…',
                      style: TextStyle(color: Colors.white38, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
        ],
      );
    },
  );

  // ─────────────────────────────────────────────────────────────────────────
  // HTML + JS
  // ─────────────────────────────────────────────────────────────────────────
  String _buildHtml() {
    final bg = _rgba(widget.theme.bg);
    final txt = _rgba(widget.theme.text);
    final gr = _rgba(widget.theme.grid);
    final bd = _rgba(widget.theme.border);
    final sep = _rgba(widget.theme.separator);
    const tpl = r'''<!DOCTYPE html>
<html>
<head>
<meta name="viewport"
  content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{
  width:100%;height:100%;background:__BG__;overflow:hidden;
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;
  -webkit-user-select:none;user-select:none;
}
#root{display:flex;flex-direction:column;width:100vw;height:100vh;overflow:hidden}
.panel{position:relative;width:100%;flex-shrink:0;overflow:hidden}
#p-main{flex:1 1 0;min-height:0}
.lbl{
  position:absolute;top:4px;left:6px;font-size:9.5px;
  display:flex;flex-wrap:wrap;gap:4px;z-index:30;
  pointer-events:none;line-height:1.5;max-width:calc(100% - 55px)
}
.sep{width:100%;height:1px;background:__SEP__;flex-shrink:0}
</style>
</head>
<body>
<div id="root">
  <div class="panel" id="p-main">
    <div class="lbl" id="l-main"></div>
    <div id="c-main" style="width:100%;height:100%"></div>
  </div>

  <div class="sep"   id="s-rsi"  style="display:none"></div>
  <div class="panel" id="p-rsi"  style="display:none">
    <div class="lbl" id="l-rsi"></div><div id="c-rsi"></div></div>

  <div class="sep"   id="s-vol"  style="display:none"></div>
  <div class="panel" id="p-vol"  style="display:none">
    <div class="lbl" id="l-vol"></div><div id="c-vol"></div></div>

  <div class="sep"   id="s-macd" style="display:none"></div>
  <div class="panel" id="p-macd" style="display:none">
    <div class="lbl" id="l-macd"></div><div id="c-macd"></div></div>

  <div class="sep"   id="s-kdj"  style="display:none"></div>
  <div class="panel" id="p-kdj"  style="display:none">
    <div class="lbl" id="l-kdj"></div><div id="c-kdj"></div></div>

  <div class="sep"   id="s-roc"  style="display:none"></div>
  <div class="panel" id="p-roc"  style="display:none">
    <div class="lbl" id="l-roc"></div><div id="c-roc"></div></div>

  <div class="sep"   id="s-cci"  style="display:none"></div>
  <div class="panel" id="p-cci"  style="display:none">
    <div class="lbl" id="l-cci"></div><div id="c-cci"></div></div>

  <div class="sep"   id="s-wr"   style="display:none"></div>
  <div class="panel" id="p-wr"   style="display:none">
    <div class="lbl" id="l-wr"></div><div id="c-wr"></div></div>
</div>

<!--
  IMPORTANT: onload fires AFTER the CDN script fully executes.
  We ONLY call window.init() once 'rdy' is received.
  This is the only race-condition-free approach.
-->
<script
  src="https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js"
  onload="CB.postMessage('rdy')"
  onerror="CB.postMessage('rdy')">
</script>

<script>
'use strict';

// ── globals ────────────────────────────────────────────────────────────────
const K = {
  BG:'__BG__', TXT:'__TXT__',
  GR:'__GR__', BD:'__BD__',
  UP:'#2EBD85', DN:'#F6465D',
  UPA:'rgba(46,189,133,0.65)',
  DNA:'rgba(246,70,93,0.65)'
};
let D = [], C = {};

// chart instances
let cM, cRsi, cVol, cMacd, cKdj, cRoc, cCci, cWr;
// series — main
let sCa, sMa5, sMa10, sMa20, sE12, sE26, sBU, sBM, sBL, sSar, sAvl;
// series — sub-panels
let sR6, sR12, sR24;
let sVol, sVM5, sVM10;
let sMH, sMDif, sMDea;
let sKK, sKD, sKJ;
let sRoc, sRMa;
let sCci, sWr;

// ── PUBLIC API (called by Flutter via runJavaScript) ──────────────────────
window.init = function(data, cfg) {
  D = data; C = cfg;
  _setColors(cfg && cfg.colors);
  _build();
  CB.postMessage('ok');
};

window.reload = function(data, cfg) {
  // Save viewport so user's scroll position is preserved across final-candle updates
  let savedRange = null;
  try { savedRange = cM && cM.timeScale().getVisibleLogicalRange(); } catch(_) {}

  D = data; C = cfg;
  _setColors(cfg && cfg.colors);
  _build();

  // Restore viewport
  if (savedRange) {
    try { cM.timeScale().setVisibleLogicalRange(savedRange); } catch(_) {}
  }
  CB.postMessage('ok');
};

window.cfg = function(cfg) {
  C = cfg;
  _setColors(cfg && cfg.colors);
  _build();
};

// ── LIVE TICK — called by TradingChartController.pushTick() ───────────────
// O(1): only updates the last bar on every series. No full rebuild.
// This is the hot path — called on every WebSocket message.
window.tick = function(c) {
  if (!sCa) return;

  // Update in-memory data store
  const last = D[D.length - 1];
  if (last && last.time === c.time) {
    D[D.length - 1] = c; // update in place (in-progress candle)
  } else {
    D.push(c);           // new candle appeared (should not happen here normally)
  }

  // Update candlestick
  sCa.update({ time:c.time, open:c.open, high:c.high, low:c.low, close:c.close });

  // Update volume bar
  if (C.showVOL && sVol) {
    sVol.update({
      time: c.time, value: c.volume,
      color: c.close >= c.open ? K.UPA : K.DNA
    });
  }

  // Update MA last point (recalculate over last N bars — cheap)
  const n = D.length;
  if (C.showMA) {
    _updLastMA(sMa5,  5,  c.time, n);
    _updLastMA(sMa10, 10, c.time, n);
    _updLastMA(sMa20, 20, c.time, n);
  }
  if (C.showEMA && sE12) {
    sE12.update({ time: c.time, value: _emaLast(D, 12) });
    sE26.update({ time: c.time, value: _emaLast(D, 26) });
  }

  _updMainLbl();
};

function _updLastMA(series, period, time, n) {
  if (!series || n < period) return;
  let v = 0;
  for (let i = n - period; i < n; i++) v += D[i].close;
  series.update({ time, value: v / period });
}

// ── MATH ───────────────────────────────────────────────────────────────────
function _ma(d, p) {
  const r = [];
  for (let i = p - 1; i < d.length; i++) {
    let v = 0;
    for (let j = i - p + 1; j <= i; j++) v += d[j].close;
    r.push({ time: d[i].time, value: v / p });
  }
  return r;
}

function _ema(d, p) {
  const k = 2 / (p + 1);
  let e = d[0].close;
  return d.map((x, i) => {
    e = i === 0 ? x.close : x.close * k + e * (1 - k);
    return { time: x.time, value: e };
  });
}

function _emaLast(d, p) {
  const k = 2 / (p + 1);
  let e = d[0].close;
  for (let i = 1; i < d.length; i++) e = d[i].close * k + e * (1 - k);
  return e;
}

function _boll(d, p, k) {
  p = p || 20; k = k || 2;
  const U = [], M = [], L = [];
  for (let i = p - 1; i < d.length; i++) {
    const s = d.slice(i - p + 1, i + 1);
    const m = s.reduce((a, x) => a + x.close, 0) / p;
    const sd = Math.sqrt(s.reduce((a, x) => a + Math.pow(x.close - m, 2), 0) / p);
    const t = d[i].time;
    U.push({ time: t, value: m + k * sd });
    M.push({ time: t, value: m });
    L.push({ time: t, value: m - k * sd });
  }
  return { U, M, L };
}

function _sar(d) {
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
        s = Math.min(s, d[i-1].low, i > 1 ? d[i-2].low : d[i-1].low);
      }
    } else {
      if (d[i].high > s) { bull = true; s = ep; ep = d[i].high; af = ST; }
      else {
        if (d[i].low < ep) { ep = d[i].low; af = Math.min(af + ST, MX); }
        s = Math.max(s, d[i-1].high, i > 1 ? d[i-2].high : d[i-1].high);
      }
    }
    r.push({ time: d[i].time, value: s });
  }
  return r;
}

// AVL: 20-period rolling average of volume
function _avl(d, p) {
  p = p || 20;
  const r = [];
  for (let i = p - 1; i < d.length; i++) {
    const s = d.slice(i - p + 1, i + 1).reduce((a, x) => a + x.volume, 0) / p;
    r.push({ time: d[i].time, value: s });
  }
  return r;
}

function _rsi(d, p) {
  const r = [];
  if (d.length <= p) return r;
  let ag = 0, al = 0;
  for (let i = 1; i <= p; i++) {
    const v = d[i].close - d[i-1].close;
    if (v > 0) ag += v; else al -= v;
  }
  ag /= p; al /= p;
  const f = (g, l) => l < 1e-9 ? 100 : 100 - 100 / (1 + g / l);
  r.push({ time: d[p].time, value: f(ag, al) });
  for (let i = p + 1; i < d.length; i++) {
    const v = d[i].close - d[i-1].close;
    ag = (ag * (p - 1) + Math.max(0,  v)) / p;
    al = (al * (p - 1) + Math.max(0, -v)) / p;
    r.push({ time: d[i].time, value: f(ag, al) });
  }
  return r;
}

function _macd(d) {
  if (!d || d.length < 26) return { dif: [], dea: [], hist: [] };
  const ef = _ema(d, 12), es = _ema(d, 26);
  const dif = d.slice(25).map((x, i) => ({
    time: x.time, value: ef[25 + i].value - es[25 + i].value
  }));
  const k = 2 / 10;
  let dea = dif[0].value;
  const deaArr = dif.map((x, i) => {
    dea = i === 0 ? x.value : x.value * k + dea * (1 - k);
    return { time: x.time, value: dea };
  });
  const hist = dif.map((x, i) => ({
    time: x.time,
    value: (x.value - deaArr[i].value) * 2,
    color: x.value >= deaArr[i].value ? K.UP : K.DN
  }));
  return { dif, dea: deaArr, hist };
}

function _kdj(d) {
  const KA = [], DA = [], JA = [];
  let k = 50, dv = 50;
  const n = 9, m = 3;
  for (let i = n - 1; i < d.length; i++) {
    const s = d.slice(i - n + 1, i + 1);
    const hi = Math.max(...s.map(x => x.high));
    const lo = Math.min(...s.map(x => x.low));
    const rsv = hi === lo ? 50 : ((d[i].close - lo) / (hi - lo)) * 100;
    k = (k * (m - 1) + rsv) / m;
    dv = (dv * (m - 1) + k) / m;
    const j = 3 * k - 2 * dv;
    KA.push({ time: d[i].time, value: k });
    DA.push({ time: d[i].time, value: dv });
    JA.push({ time: d[i].time, value: j });
  }
  return { K: KA, D: DA, J: JA };
}

function _roc(d) {
  const p = 12, mp = 6;
  const r = [];
  for (let i = p; i < d.length; i++) {
    r.push({ time: d[i].time, value: ((d[i].close - d[i-p].close) / d[i-p].close) * 100 });
  }
  const rm = [];
  for (let i = mp - 1; i < r.length; i++) {
    let v = 0;
    for (let j = i - mp + 1; j <= i; j++) v += r[j].value;
    rm.push({ time: r[i].time, value: v / mp });
  }
  return { roc: r, rocma: rm };
}

function _cci(d) {
  const p = 14;
  const r = [];
  for (let i = p - 1; i < d.length; i++) {
    const s = d.slice(i - p + 1, i + 1);
    const tp = s.map(x => (x.high + x.low + x.close) / 3);
    const m = tp.reduce((a, v) => a + v, 0) / p;
    const md = tp.reduce((a, v) => a + Math.abs(v - m), 0) / p;
    r.push({ time: d[i].time, value: md < 1e-9 ? 0 : (tp[tp.length-1] - m) / (0.015 * md) });
  }
  return r;
}

function _wr(d) {
  const p = 14;
  const r = [];
  for (let i = p - 1; i < d.length; i++) {
    const s = d.slice(i - p + 1, i + 1);
    const hi = Math.max(...s.map(x => x.high));
    const lo = Math.min(...s.map(x => x.low));
    r.push({ time: d[i].time, value: hi === lo ? -50 : ((hi - d[i].close) / (hi - lo)) * -100 });
  }
  return r;
}

// ── HELPERS ────────────────────────────────────────────────────────────────
const f2  = v => typeof v === 'number' ? v.toFixed(2) : '--';
const fk  = v => v >= 1e6 ? (v/1e6).toFixed(2)+'M' : v >= 1e3 ? (v/1e3).toFixed(2)+'K' : v.toFixed(2);

// ── PRICE-AXIS TOUCH ZOOM ───────────────────────────────────────────────────
// LightweightCharts' axisPressedMouseMove.price only fires on MOUSE events.
// On Android/iOS WebView, touch events are used instead, so we must implement
// Y-axis zoom manually.
//
// v4.1.3 note: IPriceScaleApi only exposes applyOptions() / options() / width().
// getVisiblePriceRange() / setVisiblePriceRange() do NOT exist until v5.
// The correct v4 zoom mechanism is adjusting `scaleMargins`:
//   • drag UP   (dy < 0) → decrease margins → bars fill more area → zoom IN
//   • drag DOWN (dy > 0) → increase margins → bars fill less area → zoom OUT
function _setupPriceAxisTouchZoom(chart, initMargins) {
  const container = chart.chartElement();
  let lastTouchY  = null;
  let touchActive = false;
  // Track live margin state so each drag continues from where the last ended.
  let topM    = initMargins ? initMargins.top    : 0.07;
  let bottomM = initMargins ? initMargins.bottom : 0.04;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  container.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const touch  = e.touches[0];
    const rect   = container.getBoundingClientRect();
    const localX = touch.clientX - rect.left;
    // Only intercept touches on the rightmost 80 px (price axis area)
    if (localX >= container.clientWidth - 80) {
      lastTouchY  = touch.clientY;
      touchActive = true;
      e.preventDefault();
      e.stopPropagation();
    }
  }, { passive: false });

  container.addEventListener('touchmove', (e) => {
    if (!touchActive || lastTouchY === null || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dy    = touch.clientY - lastTouchY;
    lastTouchY  = touch.clientY;
    e.preventDefault();
    e.stopPropagation();

    // Sensitivity: 0.0015 per pixel gives a natural feel.
    // dy < 0 (finger up)   → delta negative → shrink margins → zoom IN
    // dy > 0 (finger down) → delta positive → grow  margins → zoom OUT
    const delta = dy * 0.0015;
    topM    = clamp(topM    + delta, 0.01, 0.48);
    bottomM = clamp(bottomM + delta, 0.01, 0.48);
    chart.priceScale('right').applyOptions({
      scaleMargins: { top: topM, bottom: bottomM }
    });
  }, { passive: false });

  function _onEnd() {
    touchActive = false;
    lastTouchY  = null;
  }
  container.addEventListener('touchend',    _onEnd, { passive: true });
  container.addEventListener('touchcancel', _onEnd, { passive: true });
}

function _mkChart(id, h, margins) {
  const el = document.getElementById(id);
  el.style.height = h + 'px';
  return LightweightCharts.createChart(el, {
    width:  window.innerWidth,
    height: h,
    layout: { background: { color: K.BG }, textColor: K.TXT },
    grid:   { vertLines: { color: K.GR }, horzLines: { color: K.GR } },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    rightPriceScale: {
      borderColor: K.BD,
      scaleMargins: margins || { top: 0.1, bottom: 0.1 },
      minimumWidth: 62
    },
    timeScale: {
      borderColor: K.BD,
      timeVisible: true,
      secondsVisible: false,
    },
    // Allow all touch/mouse interaction
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
}

function _ln(chart, color, w) {
  return chart.addLineSeries({
    color, lineWidth: w || 1,
    priceLineVisible: false, lastValueVisible: false
  });
}

function _syncTS(a, b) {
  a.timeScale().subscribeVisibleLogicalRangeChange(r => {
    if (r) try { b.timeScale().setVisibleLogicalRange(r); } catch(_) {}
  });
  b.timeScale().subscribeVisibleLogicalRangeChange(r => {
    if (r) try { a.timeScale().setVisibleLogicalRange(r); } catch(_) {}
  });
}

function _show(id, v) {
  document.getElementById('p-' + id).style.display = v ? 'block' : 'none';
  document.getElementById('s-' + id).style.display = v ? 'block' : 'none';
}

function _setColors(colors) {
  if (!colors) return;
  if (colors.bg) K.BG = colors.bg;
  if (colors.txt) K.TXT = colors.txt;
  if (colors.gr) K.GR = colors.gr;
  if (colors.bd) K.BD = colors.bd;
  if (colors.sep) {
    document.querySelectorAll('.sep').forEach(el => {
      el.style.background = colors.sep;
    });
  }
  document.documentElement.style.background = K.BG;
  document.body.style.background = K.BG;
}

// ── BUILD (full chart construction) ────────────────────────────────────────
function _build() {
  document.documentElement.style.background = K.BG;
  document.body.style.background = K.BG;

  // Destroy old chart instances
  [cM, cRsi, cVol, cMacd, cKdj, cRoc, cCci, cWr].forEach(c => {
    try { if (c) c.remove(); } catch(_) {}
  });
  cM = cRsi = cVol = cMacd = cKdj = cRoc = cCci = cWr = null;
  sCa = sMa5 = sMa10 = sMa20 = sE12 = sE26 = sBU = sBM = sBL = sSar = sAvl = null;
  sR6 = sR12 = sR24 = null;
  sVol = sVM5 = sVM10 = null;
  sMH = sMDif = sMDea = null;
  sKK = sKD = sKJ = null;
  sRoc = sRMa = null;
  sCci = sWr = null;

  const d = D;
  if (!d || !d.length) return;

  const subH = C.subH || 82;
  const subs = [C.showRSI, C.showVOL, C.showMACD, C.showKDJ,
                C.showROC, C.showCCI, C.showWR].filter(Boolean).length;

  // Main chart fills entire flex-1 container (CSS handles actual height)
  const mainEl = document.getElementById('p-main');
  const mainH = mainEl.clientHeight || (window.innerHeight - subs * (subH + 1));

  // ── MAIN ──────────────────────────────────────────────────────────────
  cM = _mkChart('c-main', mainH, { top: 0.07, bottom: 0.04 });
  _setupPriceAxisTouchZoom(cM, { top: 0.07, bottom: 0.04 });

  sCa = cM.addCandlestickSeries({
    upColor: K.UP, downColor: K.DN,
    borderUpColor: K.UP, borderDownColor: K.DN,
    wickUpColor: K.UP, wickDownColor: K.DN
  });
  sCa.setData(d.map(x => ({ time:x.time, open:x.open, high:x.high, low:x.low, close:x.close })));

  // Moving averages
  sMa5  = _ln(cM, '#F6A623'); sMa5.setData(_ma(d, 5));
  sMa10 = _ln(cM, '#E040FB'); sMa10.setData(_ma(d, 10));
  sMa20 = _ln(cM, '#00C087'); sMa20.setData(_ma(d, 20));
  [sMa5, sMa10, sMa20].forEach(s => s.applyOptions({ visible: C.showMA }));

  // EMA
  sE12 = _ln(cM, '#FFD700'); sE12.setData(_ema(d, 12));
  sE26 = _ln(cM, '#00BFFF'); sE26.setData(_ema(d, 26));
  [sE12, sE26].forEach(s => s.applyOptions({ visible: C.showEMA }));

  // Bollinger Bands
  const bb = _boll(d);
  sBU = cM.addLineSeries({ color:'#60A5FA', lineWidth:1, lineStyle:1,
    priceLineVisible:false, lastValueVisible:false });
  sBM = cM.addLineSeries({ color:'rgba(255,255,255,0.18)', lineWidth:1, lineStyle:1,
    priceLineVisible:false, lastValueVisible:false });
  sBL = cM.addLineSeries({ color:'#F472B6', lineWidth:1, lineStyle:1,
    priceLineVisible:false, lastValueVisible:false });
  sBU.setData(bb.U); sBM.setData(bb.M); sBL.setData(bb.L);
  [sBU, sBM, sBL].forEach(s => s.applyOptions({ visible: C.showBOLL }));

  // SAR
  sSar = cM.addLineSeries({
    color: 'rgba(246,166,35,0.85)', lineWidth: 0,
    pointMarkersVisible: true, pointMarkersRadius: 1.5,
    priceLineVisible: false, lastValueVisible: false
  });
  sSar.setData(_sar(d));
  sSar.applyOptions({ visible: C.showSAR });

  // AVL — rendered as overlay on main chart (separate hidden price scale)
  sAvl = null;
  if (C.showAVL) {
    sAvl = cM.addLineSeries({
      color: '#00FFCC', lineWidth: 1, lineStyle: 0,
      priceScaleId: 'avl', priceLineVisible: false, lastValueVisible: false
    });
    sAvl.setData(_avl(d));
    try { cM.priceScale('avl').applyOptions({ visible: false }); } catch(_) {}
  }

  // Zoom to last 80 bars (comfortable initial view, user can scroll back)
  const n = d.length;
  cM.timeScale().setVisibleLogicalRange({
    from: Math.max(0, n - 80),
    to:   n + 2  // small right-padding
  });

  _updMainLbl();

  // ── RSI ──────────────────────────────────────────────────────────────
  _show('rsi', C.showRSI);
  if (C.showRSI) {
    document.getElementById('p-rsi').style.height = subH + 'px';
    cRsi = _mkChart('c-rsi', subH);
    cRsi.applyOptions({ timeScale: { visible: false } });
    const r6 = _rsi(d,6), r12 = _rsi(d,12), r24 = _rsi(d,24);
    sR6  = _ln(cRsi, '#F6A623'); sR6.setData(r6);
    sR12 = _ln(cRsi, '#E040FB'); sR12.setData(r12);
    sR24 = _ln(cRsi, '#00C087'); sR24.setData(r24);
    cRsi.timeScale().setVisibleLogicalRange({ from: Math.max(0,n-80), to: n+2 });
    _syncTS(cM, cRsi);
    document.getElementById('l-rsi').innerHTML =
      `<span style="color:#F6A623">RSI(6):${f2(r6.at(-1)?.value)}</span>` +
      `<span style="color:#E040FB">RSI(12):${f2(r12.at(-1)?.value)}</span>` +
      `<span style="color:#00C087">RSI(24):${f2(r24.at(-1)?.value)}</span>`;
  }

  // ── VOL ──────────────────────────────────────────────────────────────
  _show('vol', C.showVOL);
  if (C.showVOL) {
    document.getElementById('p-vol').style.height = subH + 'px';
    cVol = _mkChart('c-vol', subH, { top: 0.05, bottom: 0.02 });
    cVol.applyOptions({ timeScale: { visible: false } });
    sVol = cVol.addHistogramSeries({
      priceScaleId: 'right', scaleMargins: { top: 0.05, bottom: 0 }
    });
    sVol.setData(d.map(x => ({
      time: x.time, value: x.volume,
      color: x.close >= x.open ? K.UPA : K.DNA
    })));
    const vd = d.map(x => ({ time: x.time, close: x.volume }));
    sVM5  = _ln(cVol, '#F6A623'); sVM5.setData(_ma(vd, 5));
    sVM10 = _ln(cVol, '#E040FB'); sVM10.setData(_ma(vd, 10));
    if (C.showAVL) {
      sAvl = _ln(cVol, '#00FFCC', 2); sAvl.setData(_avl(d));
    }
    cVol.timeScale().setVisibleLogicalRange({ from: Math.max(0,n-80), to: n+2 });
    _syncTS(cM, cVol);
    const lv = d.at(-1);
    document.getElementById('l-vol').innerHTML =
      `<span style="color:#888">VOL:<b style="color:#eee">${fk(lv.volume)}</b></span>` +
      `<span style="color:#F6A623">MA(5):${fk(_ma(vd,5).at(-1)?.value||0)}</span>` +
      `<span style="color:#E040FB">MA(10):${fk(_ma(vd,10).at(-1)?.value||0)}</span>` +
      (C.showAVL ? `<span style="color:#00FFCC">AVL:${fk(_avl(d).at(-1)?.value||0)}</span>` : '');
  }

  // ── MACD ─────────────────────────────────────────────────────────────
  _show('macd', C.showMACD);
  if (C.showMACD) {
    document.getElementById('p-macd').style.height = subH + 'px';
    cMacd = _mkChart('c-macd', subH);
    cMacd.applyOptions({ timeScale: { visible: false } });
    const m = _macd(d);
    sMH   = cMacd.addHistogramSeries({ priceScaleId: 'right' }); sMH.setData(m.hist);
    sMDif = _ln(cMacd, '#60A5FA'); sMDif.setData(m.dif);
    sMDea = _ln(cMacd, '#F6A623'); sMDea.setData(m.dea);
    cMacd.timeScale().setVisibleLogicalRange({ from: Math.max(0,n-80), to: n+2 });
    _syncTS(cM, cMacd);
    document.getElementById('l-macd').innerHTML =
      `<span style="color:#888">MACD(12,26,9)</span>` +
      `<span style="color:#60A5FA">MACD:${f2(m.hist.at(-1)?.value)}</span>` +
      `<span style="color:#F6A623">DIF:${f2(m.dif.at(-1)?.value)}</span>` +
      `<span style="color:#E040FB">DEA:${f2(m.dea.at(-1)?.value)}</span>`;
  }

  // ── KDJ ──────────────────────────────────────────────────────────────
  _show('kdj', C.showKDJ);
  if (C.showKDJ) {
    document.getElementById('p-kdj').style.height = subH + 'px';
    cKdj = _mkChart('c-kdj', subH);
    cKdj.applyOptions({ timeScale: { visible: false } });
    const kv = _kdj(d);
    sKK = _ln(cKdj, '#F6A623'); sKK.setData(kv.K);
    sKD = _ln(cKdj, '#E040FB'); sKD.setData(kv.D);
    sKJ = _ln(cKdj, '#00C087'); sKJ.setData(kv.J);
    cKdj.timeScale().setVisibleLogicalRange({ from: Math.max(0,n-80), to: n+2 });
    _syncTS(cM, cKdj);
    document.getElementById('l-kdj').innerHTML =
      `<span style="color:#888">KDJ(9,3,3)</span>` +
      `<span style="color:#F6A623">K:${f2(kv.K.at(-1)?.value)}</span>` +
      `<span style="color:#E040FB">D:${f2(kv.D.at(-1)?.value)}</span>` +
      `<span style="color:#00C087">J:${f2(kv.J.at(-1)?.value)}</span>`;
  }

  // ── ROC ──────────────────────────────────────────────────────────────
  _show('roc', C.showROC);
  if (C.showROC) {
    document.getElementById('p-roc').style.height = subH + 'px';
    cRoc = _mkChart('c-roc', subH);
    cRoc.applyOptions({ timeScale: { visible: false } });
    const rv = _roc(d);
    sRoc = _ln(cRoc, '#F6A623'); sRoc.setData(rv.roc);
    sRMa = _ln(cRoc, '#E040FB'); sRMa.setData(rv.rocma);
    cRoc.timeScale().setVisibleLogicalRange({ from: Math.max(0,n-80), to: n+2 });
    _syncTS(cM, cRoc);
    document.getElementById('l-roc').innerHTML =
      `<span style="color:#888">ROC(12,6)</span>` +
      `<span style="color:#F6A623">ROC:${f2(rv.roc.at(-1)?.value)}</span>` +
      `<span style="color:#E040FB">ROCMA:${f2(rv.rocma.at(-1)?.value)}</span>`;
  }

  // ── CCI ──────────────────────────────────────────────────────────────
  _show('cci', C.showCCI);
  if (C.showCCI) {
    document.getElementById('p-cci').style.height = subH + 'px';
    cCci = _mkChart('c-cci', subH);
    cCci.applyOptions({ timeScale: { visible: false } });
    const cv = _cci(d);
    sCci = _ln(cCci, '#00C087'); sCci.setData(cv);
    cCci.timeScale().setVisibleLogicalRange({ from: Math.max(0,n-80), to: n+2 });
    _syncTS(cM, cCci);
    document.getElementById('l-cci').innerHTML =
      `<span style="color:#888">CCI(14)</span>` +
      `<span style="color:#00C087">${f2(cv.at(-1)?.value)}</span>`;
  }

  // ── WR ───────────────────────────────────────────────────────────────
  _show('wr', C.showWR);
  if (C.showWR) {
    document.getElementById('p-wr').style.height = subH + 'px';
    cWr = _mkChart('c-wr', subH);
    cWr.applyOptions({ timeScale: { visible: false } });
    const wv = _wr(d);
    sWr = _ln(cWr, '#F472B6'); sWr.setData(wv);
    cWr.timeScale().setVisibleLogicalRange({ from: Math.max(0,n-80), to: n+2 });
    _syncTS(cM, cWr);
    document.getElementById('l-wr').innerHTML =
      `<span style="color:#888">WR(14)</span>` +
      `<span style="color:#F472B6">${f2(wv.at(-1)?.value)}</span>`;
  }
}

// ── MAIN LABEL ─────────────────────────────────────────────────────────────
function _updMainLbl() {
  const d = D;
  if (!d.length) return;
  const n = d.length;
  let h = '';
  if (C.showMA) {
    const calc = p => n >= p ? d.slice(n-p).reduce((a,x)=>a+x.close,0)/p : 0;
    h += `<span style="color:#F6A623">MA(5):${calc(5).toFixed(2)}</span>` +
         `<span style="color:#E040FB">MA(10):${calc(10).toFixed(2)}</span>` +
         `<span style="color:#00C087">MA(20):${calc(20).toFixed(2)}</span>`;
  }
  if (C.showEMA && n >= 2) {
    h += `<span style="color:#FFD700">EMA(12):${_emaLast(d,12).toFixed(2)}</span>` +
         `<span style="color:#00BFFF">EMA(26):${_emaLast(d,26).toFixed(2)}</span>`;
  }
  if (C.showBOLL) {
    const bb = _boll(d);
    h += `<span style="color:#60A5FA">UB:${f2(bb.U.at(-1)?.value)}</span>` +
         `<span style="color:#F472B6">LB:${f2(bb.L.at(-1)?.value)}</span>`;
  }
  if (C.showSAR) {
    h += `<span style="color:#F6A623;opacity:.85">SAR:${f2(_sar(d).at(-1)?.value)}</span>`;
  }
  document.getElementById('l-main').innerHTML = h;
}

// ── RESIZE ─────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  [cM, cRsi, cVol, cMacd, cKdj, cRoc, cCci, cWr].forEach(c => {
    try { if (c) c.applyOptions({ width: w }); } catch(_) {}
  });
});
</script>
</body>
</html>''';
    return tpl
        .replaceAll('__BG__', bg)
        .replaceAll('__TXT__', txt)
        .replaceAll('__GR__', gr)
        .replaceAll('__BD__', bd)
        .replaceAll('__SEP__', sep);
  }
}
