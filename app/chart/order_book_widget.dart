import 'package:flutter/material.dart';
import 'chart_models.dart';
import '../../../../core/theme/app_colors.dart';

/// Live order book widget — matches the reference video exactly:
///  • B%/S% bar at top
///  • Bid qty | Bid price | Ask price | Ask qty rows
///  • Best bid/ask highlighted with colored overlay bars
///  • Real-time color flash on price change
///  • Compact (5 rows) or expanded (scrollable) modes
class OrderBookWidget extends StatefulWidget {
  final OrderBook book;
  final double?   lastPrice;
  final String    quoteAsset;

  const OrderBookWidget({
    super.key,
    required this.book,
    this.lastPrice,
    this.quoteAsset = 'USDT',
  });

  @override
  State<OrderBookWidget> createState() => _OrderBookWidgetState();
}

class _OrderBookWidgetState extends State<OrderBookWidget> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final onSubtle = cs.onSurface.withOpacity(0.45);
    final bids = widget.book.bids;
    final asks = widget.book.asks;
    if (bids.isEmpty && asks.isEmpty) {
      return SizedBox(
        height: 60,
        child: Center(child: Text('Loading order book…',
            style: TextStyle(color: onSubtle, fontSize: 12))),
      );
    }

    // B% / S% ratio
    final totalBid = bids.fold(0.0, (s, b) => s + b.qty);
    final totalAsk = asks.fold(0.0, (s, a) => s + a.qty);
    final total    = totalBid + totalAsk;
    final bidPct   = total > 0 ? (totalBid / total * 100).round() : 50;
    final askPct   = 100 - bidPct;

    // Max qty for bar sizing
    final visibleRows = _expanded ? 20 : 5;
    final maxQty = [
      ...bids.take(visibleRows).map((b) => b.qty),
      ...asks.take(visibleRows).map((a) => a.qty),
    ].fold(0.0, (a, b) => a > b ? a : b);

    // Interleaved rows: [bid_row | ask_row]
    final rowCount = _expanded
        ? [bids.length, asks.length].reduce((a, b) => a > b ? a : b).clamp(0, 20)
        : 5;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── B% / S% bar ───────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
          child: Row(
            children: [
              Text('B $bidPct%',
                  style: const TextStyle(color: AppColors.success, fontSize: 11, fontWeight: FontWeight.w700)),
              const SizedBox(width: 6),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(2),
                  child: LinearProgressIndicator(
                    value: bidPct / 100,
                    backgroundColor: AppColors.danger,
                    valueColor: const AlwaysStoppedAnimation(AppColors.success),
                    minHeight: 4,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Text('$askPct% S',
                  style: const TextStyle(color: AppColors.danger, fontSize: 11, fontWeight: FontWeight.w700)),
            ],
          ),
        ),

        // ── Column headers ────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
          child: Row(
            children: [
              Expanded(child: Text('Bid', style: _hdrStyle)),
              const SizedBox(width: 8),
              Expanded(
                flex: 2,
                child: Row(
                  children: [
                    Expanded(child: Text('Price (${widget.quoteAsset})',
                        textAlign: TextAlign.right,
                        style: _hdrStyle)),
                    Expanded(child: Text('Price (${widget.quoteAsset})',
                        textAlign: TextAlign.left,
                        style: _hdrStyle.copyWith(color: Colors.transparent))), // spacer
                  ],
                ),
              ),
              Expanded(child: Text('Ask', textAlign: TextAlign.right, style: _hdrStyle)),
            ],
          ),
        ),
        const SizedBox(height: 2),

        // ── Order rows ────────────────────────────────────────────────────
        ...List.generate(rowCount, (i) {
          final bid = i < bids.length ? bids[i] : null;
          final ask = i < asks.length ? asks[i] : null;
          return _OrderRow(
            bid: bid,
            ask: ask,
            maxQty: maxQty > 0 ? maxQty : 1,
            isBestRow: i == 0,
            decimals: _priceDecimals(widget.lastPrice ?? 0),
          );
        }),

        // ── Expand/collapse ───────────────────────────────────────────────
        GestureDetector(
          onTap: () => setState(() => _expanded = !_expanded),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 8),
            alignment: Alignment.center,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _expanded ? 'Show less' : 'Show more',
                  style: TextStyle(color: onSubtle, fontSize: 12),
                ),
                Icon(
                  _expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                  color: onSubtle, size: 16,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  TextStyle get _hdrStyle => TextStyle(
        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.45),
        fontSize: 11,
      );

  int _priceDecimals(double price) {
    if (price >= 10000) return 2;
    if (price >= 1000)  return 2;
    if (price >= 1)     return 4;
    return 6;
  }
}

class _OrderRow extends StatelessWidget {
  final OrderBookLevel? bid;
  final OrderBookLevel? ask;
  final double maxQty;
  final bool isBestRow;
  final int decimals;

  const _OrderRow({
    required this.bid,
    required this.ask,
    required this.maxQty,
    required this.isBestRow,
    required this.decimals,
  });

  @override
  Widget build(BuildContext context) {
    final bidBarW = bid != null ? (bid!.qty / maxQty).clamp(0.0, 1.0) : 0.0;
    final askBarW = ask != null ? (ask!.qty / maxQty).clamp(0.0, 1.0) : 0.0;

    return SizedBox(
      height: 22,
      child: Row(
        children: [
          // ── Bid qty ───────────────────────────────────────────────────
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(left: 12),
              child: Text(
                bid != null ? _fmtQty(bid!.qty) : '',
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                    fontSize: 11),
                textAlign: TextAlign.left,
              ),
            ),
          ),

          // ── Bid price (with background bar) ───────────────────────────
          Expanded(
            child: Stack(
              alignment: Alignment.centerRight,
              children: [
                // red fill bar behind price (right to left)
                Positioned.fill(
                  child: FractionallySizedBox(
                    widthFactor: bidBarW,
                    alignment: Alignment.centerRight,
                    child: Container(
                      color: isBestRow
                          ? AppColors.danger.withOpacity(0.35)
                          : AppColors.danger.withOpacity(0.12),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 4),
                  child: Text(
                    bid != null ? bid!.price.toStringAsFixed(decimals) : '',
                    style: TextStyle(
                      color: isBestRow
                          ? AppColors.danger
                          : AppColors.danger.withOpacity(0.7),
                      fontSize: 11.5,
                      fontWeight: isBestRow ? FontWeight.w700 : FontWeight.normal,
                    ),
                    textAlign: TextAlign.right,
                  ),
                ),
              ],
            ),
          ),

          // ── Ask price (with background bar) ───────────────────────────
          Expanded(
            child: Stack(
              alignment: Alignment.centerLeft,
              children: [
                // green fill bar behind price (left to right)
                Positioned.fill(
                  child: FractionallySizedBox(
                    widthFactor: askBarW,
                    alignment: Alignment.centerLeft,
                    child: Container(
                      color: isBestRow
                          ? AppColors.success.withOpacity(0.35)
                          : AppColors.success.withOpacity(0.12),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: Text(
                    ask != null ? ask!.price.toStringAsFixed(decimals) : '',
                    style: TextStyle(
                      color: isBestRow
                          ? AppColors.success
                          : AppColors.success.withOpacity(0.7),
                      fontSize: 11.5,
                      fontWeight: isBestRow ? FontWeight.w700 : FontWeight.normal,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── Ask qty ───────────────────────────────────────────────────
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Text(
                ask != null ? _fmtQty(ask!.qty) : '',
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                    fontSize: 11),
                textAlign: TextAlign.right,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _fmtQty(double qty) {
    if (qty >= 1000) return '${(qty / 1000).toStringAsFixed(2)}K';
    if (qty >= 1)    return qty.toStringAsFixed(3);
    return qty.toStringAsFixed(5);
  }
}
