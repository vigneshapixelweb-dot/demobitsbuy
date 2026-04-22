import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:web_socket_channel/web_socket_channel.dart';
import 'chart_models.dart';

class BinanceService {
  static const _rest = 'https://api.binance.com/api/v3';
  static const _ws   = 'wss://stream.binance.com:9443/ws';

  WebSocketChannel? _klinesChannel;
  StreamSubscription? _klinesSub;
  WebSocketChannel? _depthChannel;
  StreamSubscription? _depthSub;

  // ── interval mapping ──────────────────────────────────────────────────────
  static String toWsInterval(String iv) => const {
    '1s':'1s','1m':'1m','3m':'3m','5m':'5m','15m':'15m','30m':'30m',
    '1h':'1h','2h':'2h','4h':'4h','6h':'6h','8h':'8h','12h':'12h',
    '1D':'1d','3D':'3d','1W':'1w','1M':'1M',
  }[iv] ?? '1d';

  static String toRestInterval(String iv) => const {
    '1s':'1m','2m':'1m','2D':'1d','5D':'3d','3M':'1M',
  }[iv] ?? toWsInterval(iv);

  // ── REST: klines ──────────────────────────────────────────────────────────
  Future<List<CandleData>> fetchKlines(String symbol, String interval, {int limit=300}) async {
    try {
      final sym = symbol.replaceAll('/','').toUpperCase();
      final uri = Uri.parse('$_rest/klines?symbol=$sym&interval=${toRestInterval(interval)}&limit=$limit');
      final res = await http.get(uri).timeout(const Duration(seconds:12));
      if (res.statusCode!=200) throw Exception();
      return (jsonDecode(res.body) as List).map((k)=>CandleData.fromBinanceKline(k as List)).toList();
    } catch(_) { return SampleData.btcUsdt1d(); }
  }

  // ── REST: 24h ticker ──────────────────────────────────────────────────────
  Future<Ticker24h> fetch24h(String symbol) async {
    try {
      final sym = symbol.replaceAll('/','').toUpperCase();
      final res = await http.get(Uri.parse('$_rest/ticker/24hr?symbol=$sym')).timeout(const Duration(seconds:10));
      if (res.statusCode!=200) throw Exception();
      return Ticker24h.fromBinance(jsonDecode(res.body) as Map<String,dynamic>);
    } catch(_) { return Ticker24h.fallback(); }
  }

  // ── REST: order book snapshot ─────────────────────────────────────────────
  Future<OrderBook> fetchOrderBook(String symbol, {int limit=20}) async {
    try {
      final sym = symbol.replaceAll('/','').toUpperCase();
      final res = await http.get(Uri.parse('$_rest/depth?symbol=$sym&limit=$limit')).timeout(const Duration(seconds:8));
      if (res.statusCode!=200) throw Exception();
      final j = jsonDecode(res.body) as Map<String,dynamic>;
      return _parseBook(j['bids'] as List, j['asks'] as List);
    } catch(_) { return OrderBook.empty(); }
  }

  OrderBook _parseBook(List bids, List asks) => OrderBook(
    bids: bids.map((b)=>OrderBookLevel(double.parse(b[0].toString()),double.parse(b[1].toString()))).toList(),
    asks: asks.map((a)=>OrderBookLevel(double.parse(a[0].toString()),double.parse(a[1].toString()))).toList(),
  );

  // ── WebSocket: klines ─────────────────────────────────────────────────────
  void connectKlines({
    required String symbol,
    required String interval,
    required void Function(CandleData, bool isFinal) onCandle,
    void Function()? onDisconnect,
  }) {
    _klinesSub?.cancel(); _klinesChannel?.sink.close();
    final sym = symbol.replaceAll('/','').toLowerCase();
    final iv  = toWsInterval(interval);
    try {
      _klinesChannel = WebSocketChannel.connect(Uri.parse('$_ws/${sym}@kline_$iv'));
      _klinesSub = _klinesChannel!.stream.listen(
        (data) {
          try {
            final j = jsonDecode(data as String) as Map<String,dynamic>;
            if (j['e']=='kline') {
              final k = j['k'] as Map<String,dynamic>;
              onCandle(CandleData.fromBinanceWsKline(k), k['x'] as bool);
            }
          } catch(_) {}
        },
        onError:(_){onDisconnect?.call();},
        onDone:(){onDisconnect?.call();},
        cancelOnError:false,
      );
    } catch(_) {}
  }

  // ── WebSocket: depth stream (100ms updates) ───────────────────────────────
  /// Streams incremental depth updates. The caller maintains the order book.
  void connectDepth({
    required String symbol,
    required void Function(List bids, List asks, bool isSnapshot) onUpdate,
    void Function()? onDisconnect,
  }) {
    _depthSub?.cancel(); _depthChannel?.sink.close();
    final sym = symbol.replaceAll('/','').toLowerCase();
    try {
      _depthChannel = WebSocketChannel.connect(Uri.parse('$_ws/${sym}@depth20@100ms'));
      _depthSub = _depthChannel!.stream.listen(
        (data) {
          try {
            final j = jsonDecode(data as String) as Map<String,dynamic>;
            // Partial depth stream: {lastUpdateId, bids:[], asks:[]}
            final bids = j['b'] as List? ?? j['bids'] as List? ?? [];
            final asks = j['a'] as List? ?? j['asks'] as List? ?? [];
            final isSnapshot = j.containsKey('bids') || j.containsKey('asks');
            onUpdate(bids, asks, isSnapshot);
          } catch(_) {}
        },
        onError:(_){onDisconnect?.call();},
        onDone:(){onDisconnect?.call();},
        cancelOnError:false,
      );
    } catch(_) {}
  }

  void disconnectAll() {
    _klinesSub?.cancel(); _klinesChannel?.sink.close();
    _depthSub?.cancel(); _depthChannel?.sink.close();
    _klinesSub=_klinesChannel=_depthSub=_depthChannel=null;
  }

  void dispose() => disconnectAll();
}
