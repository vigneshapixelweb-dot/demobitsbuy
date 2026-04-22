import 'dart:async';
import 'dart:collection';
import 'package:flutter/material.dart';
import 'trading_chart_widget.dart';
import 'order_book_widget.dart';
import 'pair_selector.dart';
import 'chart_models.dart';
import 'binance_service.dart';
import '../../../../core/theme/app_colors.dart';

const _moreRows = [
  ['1s', '2m', '3m', '5m'],
  ['30m', '2h', '6h', '8h'],
  ['12h', '2D', '3D', '5D'],
  ['1W', '1M', '3M', ''],
];
const _quickIvs = ['1m', '15m', '1h', '4h', '1D'];

const _overlayKeys = ['MA', 'EMA', 'BOLL', 'SAR', 'AVL'];
const _subPanelKeys = ['VOL', 'MACD', 'KDJ', 'RSI', 'ROC', 'CCI', 'WR'];

const _newsItems = [
  'How this week\'s rout in Korean stocks might have trigge…',
  'With Trump\'s conflict involving Iran, the responsibilities…',
  'Ex-OpenAI researcher\'s hedge fund reveals big Bitcoin position',
  'Multiple institutions increase cryptocurrency holdings in Q1',
];

class TradingChartScreen extends StatefulWidget {
  final String initialSymbol;
  const TradingChartScreen({super.key, this.initialSymbol = 'BTC/USDT'});

  @override
  State<TradingChartScreen> createState() => _TradingChartScreenState();
}

class _TradingChartScreenState extends State<TradingChartScreen>
    with SingleTickerProviderStateMixin {
  // ── services ──────────────────────────────────────────────────────────────
  final _svc = BinanceService();

  // ── chart controller — direct JS tick injection, bypasses setState ────────
  final _chartCtrl = TradingChartController();

  // ── chart data ────────────────────────────────────────────────────────────
  List<CandleData> _candles = [];
  CandleData? _live;
  Ticker24h? _ticker;
  bool _loading = true;
  bool _wsOn = false;

  // ── order book ────────────────────────────────────────────────────────────
  final _bidsMap = SplayTreeMap<double, double>((a, b) => b.compareTo(a));
  final _asksMap = SplayTreeMap<double, double>();
  OrderBook _book = OrderBook.empty();
  Timer? _bookTimer;
  bool _bookReady = false;

  // ── UI state ──────────────────────────────────────────────────────────────
  String _symbol = 'BTC/USDT';
  String _interval = '1D';
  int _newsIdx = 0;
  bool _showNews = true;
  int _obTab = 0;

  // Always reassign NEW Set — never mutate the old one.
  // This is required so didUpdateWidget in TradingChartWidget detects changes.
  Set<String> _subInds = {'VOL', 'RSI', 'MACD'};
  bool _showMA = true;
  bool _showEMA = false;
  bool _showBOLL = true;
  bool _showSAR = false;
  bool _showAVL = false;

  late final TabController _obTabCtrl;

  @override
  void initState() {
    super.initState();
    _symbol = widget.initialSymbol;
    _obTabCtrl = TabController(length: 3, vsync: this)
      ..addListener(() => setState(() => _obTab = _obTabCtrl.index));
    _load();
  }

  @override
  void dispose() {
    _svc.dispose();
    _bookTimer?.cancel();
    _obTabCtrl.dispose();
    super.dispose();
  }

  // ── load ──────────────────────────────────────────────────────────────────
  Future<void> _load() async {
    setState(() {
      _loading = true;
      _wsOn = false;
      _bookReady = false;
    });
    _svc.disconnectAll();
    _bidsMap.clear();
    _asksMap.clear();

    // ── INTERNAL PAIR: BBX/USDT — load static trade history, skip all APIs ──
    if (_symbol == 'BBX/USDT') {
      final candles = SampleData.bbxUsdtInternal();
      final last = candles.isNotEmpty ? candles.last.close : 30.0;
      setState(() {
        _candles = candles;
        _ticker = Ticker24h(
          high: candles.map((c) => c.high).fold(last, (a, b) => a > b ? a : b),
          low: candles.map((c) => c.low).fold(last, (a, b) => a < b ? a : b),
          vol: candles.map((c) => c.volume).fold(0.0, (a, b) => a + b),
          turnover: candles
              .map((c) => c.volume * c.close)
              .fold(0.0, (a, b) => a + b),
          changePct: 0.0,
          last: last,
        );
        _live = null;
        _loading = false;
        _bookReady = false; // no order book for internal pair
      });
      return; // do NOT start websocket streams
    }

    final results = await Future.wait([
      _svc.fetchKlines(_symbol, _interval),
      _svc.fetch24h(_symbol),
      _svc.fetchOrderBook(_symbol, limit: 20),
    ]);
    if (!mounted) return;

    final ob = results[2] as OrderBook;
    for (final b in ob.bids) _bidsMap[b.price] = b.qty;
    for (final a in ob.asks) _asksMap[a.price] = a.qty;

    setState(() {
      _candles = results[0] as List<CandleData>;
      _ticker = results[1] as Ticker24h;
      _live = null;
      _loading = false;
      _bookReady = true;
      _book = _makeBook();
    });

    Future.microtask(_startStreams);
  }

  void _startStreams() {
    // ── Kline WebSocket ─────────────────────────────────────────────────────
    _svc.connectKlines(
      symbol: _symbol,
      interval: _interval,
      onCandle: (c, isFinal) {
        if (!mounted) return;

        // ┌─────────────────────────────────────────────────────────────────┐
        // │  LIVE CHART UPDATE — direct JS, NO Flutter rebuild needed.      │
        // │                                                                 │
        // │  For non-final (in-progress) candles we call pushTick() which  │
        // │  routes straight to window.tick() in JS via runJavaScript().   │
        // │  This is O(1) and has zero widget-tree overhead.               │
        // │                                                                 │
        // │  For final candles we rely on setState + didUpdateWidget which  │
        // │  calls window.reload() to recalculate all indicators.          │
        // └─────────────────────────────────────────────────────────────────┘
        if (!isFinal) {
          _chartCtrl.pushTick(c);
        }

        // setState is still called on every tick so the price header
        // (current price, live dot) stays up-to-date.
        setState(() {
          _live = c;
          _wsOn = true;
          if (isFinal) {
            if (_candles.isEmpty) {
              _candles = [c];
            } else {
              final lastT = _candles.last.time;
              if (c.time == lastT) {
                final next = List<CandleData>.from(_candles);
                next[next.length - 1] = c;
                _candles = next;
              } else if (c.time > lastT) {
                _candles = [..._candles, c];
              }
            }
          }
        });
      },
      onDisconnect: () {
        if (mounted) setState(() => _wsOn = false);
      },
    );

    // ── Depth WebSocket ─────────────────────────────────────────────────────
    _svc.connectDepth(
      symbol: _symbol,
      onUpdate: (bids, asks, isSnapshot) {
        if (isSnapshot) {
          _bidsMap.clear();
          _asksMap.clear();
          for (final b in bids) {
            final p = double.parse(b[0].toString());
            final q = double.parse(b[1].toString());
            if (q == 0) continue;
            _bidsMap[p] = q;
          }
          for (final a in asks) {
            final p = double.parse(a[0].toString());
            final q = double.parse(a[1].toString());
            if (q == 0) continue;
            _asksMap[p] = q;
          }
        } else {
          for (final b in bids) {
            final p = double.parse(b[0].toString());
            final q = double.parse(b[1].toString());
            q == 0 ? _bidsMap.remove(p) : _bidsMap[p] = q;
          }
          for (final a in asks) {
            final p = double.parse(a[0].toString());
            final q = double.parse(a[1].toString());
            q == 0 ? _asksMap.remove(p) : _asksMap[p] = q;
          }
        }
        // Throttle order book redraws to ~4 fps
        _bookTimer ??= Timer(const Duration(milliseconds: 250), () {
          _bookTimer = null;
          if (mounted) setState(() => _book = _makeBook());
        });
      },
    );
  }

  OrderBook _makeBook() {
    final bids = _bidsMap.entries
        .take(20)
        .map((e) => OrderBookLevel(e.key, e.value))
        .toList();
    final asks = _asksMap.entries
        .take(20)
        .map((e) => OrderBookLevel(e.key, e.value))
        .toList();
    return OrderBook(bids: bids, asks: asks);
  }

  // ── pair change ───────────────────────────────────────────────────────────
  Future<void> changePair() async {
    final sel = await showPairSelector(context, _symbol);
    if (sel != null && sel != _symbol) {
      setState(() => _symbol = sel);
      _load();
    }
  }

  // ── interval change ───────────────────────────────────────────────────────
  void _changeInterval(String iv) {
    if (iv.isEmpty || iv == _interval) return;
    setState(() => _interval = iv);
    _load();
  }

  // ── indicator toggles ─────────────────────────────────────────────────────
  void _toggleSub(String ind) {
    setState(() {
      // NEW Set reference — critical for didUpdateWidget to fire
      final next = Set<String>.from(_subInds);
      next.contains(ind) ? next.remove(ind) : next.add(ind);
      _subInds = next;
    });
  }

  void _toggleOverlay(String key) {
    setState(() {
      switch (key) {
        case 'MA':
          _showMA = !_showMA;
        case 'EMA':
          _showEMA = !_showEMA;
        case 'BOLL':
          _showBOLL = !_showBOLL;
        case 'SAR':
          _showSAR = !_showSAR;
        case 'AVL':
          _showAVL = !_showAVL;
      }
    });
  }

  // ── helpers ───────────────────────────────────────────────────────────────
  double get _price => _live?.close ?? _ticker?.last ?? 0;
  double get _changePct => _ticker?.changePct ?? 0;
  bool get _bull => _changePct >= 0;
  Color get _priceCol => _bull ? AppColors.success : AppColors.danger;
  String get _base => _symbol.split('/').first;
  String get _quote => _symbol.split('/').last;

  /// Total pixel height the chart container needs.
  /// Uses the ACTUAL screen height so the chart always fits on screen.
  double _chartH(BuildContext ctx) {
    final screenH = MediaQuery.of(ctx).size.height;
    final subCount = _subInds.length;
    final subTotal = subCount * (kSubPanelHeight + 1.0);
    // Main chart: 38% of screen height, clamped between 220–370px
    final mainH = (screenH * 0.38).clamp(220.0, 370.0);
    return mainH + subTotal;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUILD
  // Layout: Column (not inside any ScrollView for the chart area)
  //   AppBar
  //   PriceHeader
  //   TabRow
  //   [NewsBanner]
  //   IntervalRow
  //   ── SizedBox(height=chartH) ← fixed height, WebView takes gestures ──
  //      TradingChartWidget
  //   IndicatorBar
  //   ── Expanded → SingleChildScrollView ──
  //      PerformanceRow
  //      OrderBookSection
  //
  // Why no ScrollView around chart:
  //   Flutter's gesture arena gives the NEAREST scroll view first claim on
  //   touches. With the chart inside a ScrollView, ALL gestures are consumed
  //   by Flutter and the WebView never sees them. Chart becomes non-interactive.
  //
  //   With the chart in a fixed-height SizedBox OUTSIDE any ScrollView,
  //   combined with gestureRecognizers on the WebViewWidget, the WebView
  //   correctly wins horizontal-drag (chart scroll) and scale (pinch-zoom),
  //   while vertical-drag bubbles up to Flutter (page scroll).
  // ─────────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final pageBg = theme.scaffoldBackgroundColor;
    final cs = theme.colorScheme;
    final on = cs.onSurface;
    final onMuted = on.withOpacity(0.6);
    final onSubtle = on.withOpacity(0.38);
    final onFaint = on.withOpacity(0.28);
    final accent = cs.secondary;
    return Scaffold(
      backgroundColor: pageBg,
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            children: [
              _buildAppBar(onMuted),
              _buildPriceHeader(onMuted, onSubtle),
              _buildTabRow(on, onSubtle, accent),
              if (_showNews) _buildNewsBanner(onMuted),
              _buildIntervalRow(onMuted, accent),

              // ── CHART — fixed height, now inside page scroll ───────────
              SizedBox(
                height: _chartH(context),
                child: _loading
                    ? Center(
                        child: CircularProgressIndicator(
                          color: Theme.of(context).colorScheme.secondary,
                          strokeWidth: 2,
                        ),
                      )
                    : TradingChartWidget(
                        // ValueKey ensures full widget recreation on pair/interval change
                        key: ValueKey('${_symbol}_$_interval'),
                        candles: _candles,
                        controller: _chartCtrl,
                        activeIndicators: _subInds,
                        showMA: _showMA,
                        showEMA: _showEMA,
                        showBOLL: _showBOLL,
                        showSAR: _showSAR,
                        showAVL: _showAVL,
                        interval: _interval,
                        symbol: _symbol,
                        theme: ChartTheme.fromTheme(theme),
                      ),
              ),

              _buildIndicatorBar(),
              _buildPerformanceRow(onFaint),
              // _buildOrderBookSection(onSubtle, accent),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  // ── app bar ───────────────────────────────────────────────────────────────
  Widget _buildAppBar(Color iconColor) {
    return Container(
      height: 52,
      color: Theme.of(context).scaffoldBackgroundColor,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Row(
        children: [
          _iconBtn(
            Icons.arrow_back_ios_new_rounded,
            () => Navigator.maybePop(context),
          ),
          const SizedBox(width: 2),
          // Tap to open pair selector
          GestureDetector(
            onTap:changePair,
            behavior: HitTestBehavior.opaque,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _symbol,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.3,
                  ),
                ),
                Icon(Icons.keyboard_arrow_down, color: iconColor, size: 20),
              ],
            ),
          ),
          const SizedBox(width: 6),
          Text(
            '${_bull ? '+' : ''}${_changePct.toStringAsFixed(2)}%',
            style: TextStyle(
              color: _priceCol,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 6),
          // Live WebSocket indicator dot
          AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            width: 7,
            height: 7,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _wsOn
                  ? Theme.of(context).colorScheme.secondary
                  : AppColors.warning,
              boxShadow: _wsOn
                  ? [
                      BoxShadow(
                        color: Theme.of(
                          context,
                        ).colorScheme.secondary.withOpacity(0.6),
                        blurRadius: 5,
                      ),
                    ]
                  : [],
            ),
          ),
          const Spacer(),
          _iconBtn(Icons.star_border_rounded, () {}),
          _iconBtn(Icons.format_list_bulleted_rounded, () {}),
          _iconBtn(Icons.notifications_none_rounded, () {}),
          _iconBtn(Icons.share_rounded, () {}),
        ],
      ),
    );
  }

  Widget _iconBtn(IconData icon, VoidCallback onTap) => IconButton(
    icon: Icon(
      icon,
      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.55),
      size: 21,
    ),
    onPressed: onTap,
    padding: const EdgeInsets.symmetric(horizontal: 5),
    constraints: const BoxConstraints(minWidth: 34, minHeight: 34),
    visualDensity: VisualDensity.compact,
  );

  // ── price header ──────────────────────────────────────────────────────────
  Widget _buildPriceHeader(Color muted, Color subtle) {
    final t = _ticker;
    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      padding: const EdgeInsets.fromLTRB(14, 4, 14, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 160),
                transitionBuilder: (child, anim) =>
                    FadeTransition(opacity: anim, child: child),
                child: Text(
                  _price > 0 ? _price.toStringAsFixed(2) : '--',
                  key: ValueKey(_price.toStringAsFixed(0)),
                  style: TextStyle(
                    color: _priceCol,
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.5,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              if (t != null)
                Text(
                  '≈\$${t.last.toStringAsFixed(2)}',
                  style: TextStyle(color: subtle, fontSize: 12),
                ),
              const SizedBox(width: 6),
              Text(
                '${_bull ? '+' : ''}${_changePct.toStringAsFixed(2)}%',
                style: TextStyle(
                  color: _priceCol,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          if (t != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                _stat24('24h high', t.high.toStringAsFixed(2), muted),
                _stat24('24h low', t.low.toStringAsFixed(2), muted),
                _stat24('24h Vol ($_base)', _fmtVol(t.vol), subtle),
                _stat24('Turnover ($_quote)', _fmtVol(t.turnover), subtle),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _stat24(String label, String val, Color vc) => Expanded(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: vc.withOpacity(0.7), fontSize: 10)),
        const SizedBox(height: 1),
        Text(
          val,
          style: TextStyle(
            color: vc,
            fontSize: 11.5,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    ),
  );

  String _fmtVol(double v) {
    if (v >= 1e9) return '${(v / 1e9).toStringAsFixed(2)}B';
    if (v >= 1e6) return '${(v / 1e6).toStringAsFixed(2)}M';
    if (v >= 1e3) return '${(v / 1e3).toStringAsFixed(2)}K';
    return v.toStringAsFixed(2);
  }

  // ── tab row ───────────────────────────────────────────────────────────────
  Widget _buildTabRow(Color on, Color subtle, Color accent) => Container(
    color: Theme.of(context).scaffoldBackgroundColor,
    child: Row(
      children: ['Chart', 'Data', 'Square', 'About'].map((t) {
        final sel = t == 'Chart';
        return GestureDetector(
          onTap: () {},
          child: Padding(
            padding: const EdgeInsets.only(left: 16, right: 4),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 8),
                Text(
                  t,
                  style: TextStyle(
                    color: sel ? on : subtle,
                    fontSize: 14,
                    fontWeight: sel ? FontWeight.w700 : FontWeight.normal,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  height: 2,
                  width: sel ? 18.0 : 0,
                  decoration: BoxDecoration(
                    color: accent,
                    borderRadius: BorderRadius.circular(1),
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    ),
  );

  // ── news banner ───────────────────────────────────────────────────────────
  Widget _buildNewsBanner(Color muted) => Container(
    color: Theme.of(context).scaffoldBackgroundColor,
    padding: const EdgeInsets.fromLTRB(12, 5, 12, 5),
    child: Row(
      children: [
        Icon(Icons.campaign_outlined, color: muted, size: 15),
        const SizedBox(width: 6),
        Expanded(
          child: GestureDetector(
            onHorizontalDragEnd: (_) =>
                setState(() => _newsIdx = (_newsIdx + 1) % _newsItems.length),
            child: Text(
              _newsItems[_newsIdx],
              style: TextStyle(color: muted, fontSize: 12),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
        GestureDetector(
          onTap: () => setState(() => _showNews = false),
          child: Padding(
            padding: const EdgeInsets.only(left: 8),
            child: Icon(Icons.close, color: muted, size: 15),
          ),
        ),
      ],
    ),
  );

  // ── interval row ──────────────────────────────────────────────────────────
  Widget _buildIntervalRow(Color muted, Color accent) => Container(
    color: Theme.of(context).scaffoldBackgroundColor,
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
    child: Row(
      children: [
        ..._quickIvs.map((iv) {
          final sel = iv == _interval;
          return GestureDetector(
            onTap: () => _changeInterval(iv),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
              margin: const EdgeInsets.only(right: 2),
              decoration: BoxDecoration(
                color: sel
                    ? Theme.of(context).colorScheme.surface
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                iv,
                style: TextStyle(
                  color: sel ? Theme.of(context).colorScheme.onSurface : muted,
                  fontSize: 13,
                  fontWeight: sel ? FontWeight.w700 : FontWeight.normal,
                ),
              ),
            ),
          );
        }),
        // "More" button
        GestureDetector(
          onTap: showMoreSheet,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
            margin: const EdgeInsets.only(right: 2),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _quickIvs.contains(_interval) ? 'More' : _interval,
                  style: TextStyle(
                    color: !_quickIvs.contains(_interval)
                        ? Theme.of(context).colorScheme.onSurface
                        : muted,
                    fontSize: 13,
                    fontWeight: !_quickIvs.contains(_interval)
                        ? FontWeight.w700
                        : FontWeight.normal,
                  ),
                ),
                Icon(Icons.keyboard_arrow_down, color: muted, size: 15),
              ],
            ),
          ),
        ),
        const Spacer(),
        _toolBtn(Icons.candlestick_chart_outlined, muted),
        _toolBtn(Icons.edit_outlined, muted),
        _toolBtn(Icons.tune_rounded, muted),
      ],
    ),
  );

  Widget _toolBtn(IconData icon, Color color) => GestureDetector(
    onTap: () {},
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
      child: Icon(icon, color: color, size: 19),
    ),
  );

  // ── "More" intervals bottom sheet ─────────────────────────────────────────
  void showMoreSheet() => showModalBottomSheet(
    context: context,
    backgroundColor: Theme.of(context).colorScheme.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (ctx) => Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Time period',
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurface,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 18),
          ..._moreRows.map(
            (row) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: row.map((iv) {
                  if (iv.isEmpty) {
                    return const Expanded(child: SizedBox());
                  }
                  final sel = iv == _interval;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () {
                        Navigator.pop(ctx);
                        _changeInterval(iv);
                      },
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: sel
                              ? Theme.of(
                                  context,
                                ).colorScheme.secondary.withOpacity(0.12)
                              : Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(6),
                          border: sel
                              ? Border.all(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.secondary,
                                )
                              : null,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          iv,
                          style: TextStyle(
                            color: sel
                                ? Theme.of(context).colorScheme.secondary
                                : Theme.of(
                                    context,
                                  ).colorScheme.onSurface.withOpacity(0.7),
                            fontSize: 13,
                            fontWeight: sel
                                ? FontWeight.w700
                                : FontWeight.normal,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(height: 4),
          GestureDetector(
            onTap: () => Navigator.pop(ctx),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Select your preferred intervals',
                  style: TextStyle(
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withOpacity(0.6),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(
                  Icons.chevron_right,
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withOpacity(0.45),
                  size: 18,
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );

  // ── indicator bar ─────────────────────────────────────────────────────────
  Widget _buildIndicatorBar() => Container(
    color: Theme.of(context).scaffoldBackgroundColor,
    padding: const EdgeInsets.symmetric(vertical: 5),
    child: SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: Row(
        children: [
          ..._overlayKeys.map(
            (k) => _chip(k, _overlayActive(k), () => _toggleOverlay(k)),
          ),
          Container(
            width: 1,
            height: 18,
            margin: const EdgeInsets.symmetric(horizontal: 6),
            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.12),
          ),
          ..._subPanelKeys.map(
            (k) => _chip(k, _subInds.contains(k), () => _toggleSub(k)),
          ),
          Padding(
            padding: const EdgeInsets.only(left: 6),
            child: Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Icon(
                Icons.bar_chart_rounded,
                color: Theme.of(context).colorScheme.secondary,
                size: 17,
              ),
            ),
          ),
        ],
      ),
    ),
  );

  bool _overlayActive(String k) => switch (k) {
    'MA' => _showMA,
    'EMA' => _showEMA,
    'BOLL' => _showBOLL,
    'SAR' => _showSAR,
    'AVL' => _showAVL,
    _ => false,
  };

  Widget _chip(String label, bool active, VoidCallback onTap) =>
      GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          margin: const EdgeInsets.only(right: 4),
          decoration: BoxDecoration(
            color: active
                ? Theme.of(context).colorScheme.surface
                : Colors.transparent,
            borderRadius: BorderRadius.circular(4),
            border: active
                ? Border.all(
                    color: Theme.of(
                      context,
                    ).colorScheme.secondary.withOpacity(0.5),
                  )
                : null,
          ),
          child: Text(
            label,
            style: TextStyle(
              color: active
                  ? Theme.of(context).colorScheme.onSurface
                  : Theme.of(context).colorScheme.onSurface.withOpacity(0.45),
              fontSize: 12,
              fontWeight: active ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ),
      );

  // ── performance row ───────────────────────────────────────────────────────
  Widget _buildPerformanceRow(Color faint) {
    const periods = [
      ('Today', 1),
      ('7 days', 7),
      ('30 days', 30),
      ('90 days', 90),
      ('180 days', 180),
    ];
    final last = _candles.isNotEmpty ? _candles.last.close : 0.0;
    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: periods.map((p) {
          final pct = _periodPct(last, p.$2);
          final pos = pct >= 0;
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(p.$1, style: TextStyle(color: faint, fontSize: 10)),
              const SizedBox(height: 3),
              Text(
                '${pos ? '+' : ''}${pct.toStringAsFixed(2)}%',
                style: TextStyle(
                  color: pos ? AppColors.success : AppColors.danger,
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }

  double _periodPct(double last, int days) {
    if (_candles.isEmpty || last == 0) return 0;
    final idx = (_candles.length - 1 - days).clamp(0, _candles.length - 1);
    final base = _candles[idx].close;
    return base == 0 ? 0 : ((last - base) / base) * 100;
  }

  // ── order book section ────────────────────────────────────────────────────
  Widget _buildOrderBookSection(Color subtle, Color accent) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Tab bar
        Container(
          color: Theme.of(context).scaffoldBackgroundColor,
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
          child: Row(
            children: [
              ...[('Order book', 0), ('Depth', 1), ('Trades', 2)].map((t) {
                final sel = _obTab == t.$2;
                return GestureDetector(
                  onTap: () {
                    setState(() => _obTab = t.$2);
                    _obTabCtrl.animateTo(t.$2);
                  },
                  child: Padding(
                    padding: const EdgeInsets.only(right: 22, bottom: 8),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          t.$1,
                          style: TextStyle(
                            color: sel
                                ? Theme.of(context).colorScheme.onSurface
                                : subtle,
                            fontSize: 13,
                            fontWeight: sel
                                ? FontWeight.w700
                                : FontWeight.normal,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          height: 2,
                          width: sel ? t.$1.length * 7.0 : 0,
                          decoration: BoxDecoration(
                            color: accent,
                            borderRadius: BorderRadius.circular(1),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
        Divider(height: 1, thickness: 1, color: Theme.of(context).dividerColor),

        if (_obTab == 0)
          _bookReady
              ? OrderBookWidget(
                  book: _book,
                  lastPrice: _price,
                  quoteAsset: _quote,
                )
              : SizedBox(
                  height: 100,
                  child: Center(
                    child: CircularProgressIndicator(
                      color: Theme.of(context).colorScheme.secondary,
                      strokeWidth: 1.5,
                    ),
                  ),
                ),

        if (_obTab == 1)
          SizedBox(
            height: 100,
            child: Center(
              child: Text(
                'Depth chart coming soon',
                style: TextStyle(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withOpacity(0.45),
                  fontSize: 13,
                ),
              ),
            ),
          ),

        if (_obTab == 2)
          SizedBox(
            height: 100,
            child: Center(
              child: Text(
                'Trades feed coming soon',
                style: TextStyle(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withOpacity(0.45),
                  fontSize: 13,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
