import 'package:flutter/material.dart';

/// Popular trading pairs shown in the selector
const List<Map<String, String>> kPopularPairs = [
  // ── Internal pair — loads static on-chain trade history ───────────────────
  {'symbol': 'BBX/USDT', 'name': 'BitsBuys', 'category': 'Internal'},
  // ── External pairs ────────────────────────────────────────────────────────
  {'symbol': 'BTC/USDT', 'name': 'Bitcoin', 'category': 'Crypto'},
  {'symbol': 'ETH/USDT', 'name': 'Ethereum', 'category': 'Crypto'},
  {'symbol': 'BNB/USDT', 'name': 'BNB', 'category': 'Crypto'},
  {'symbol': 'SOL/USDT', 'name': 'Solana', 'category': 'Crypto'},
  {'symbol': 'XRP/USDT', 'name': 'XRP', 'category': 'Crypto'},
  {'symbol': 'ADA/USDT', 'name': 'Cardano', 'category': 'Crypto'},
  {'symbol': 'DOGE/USDT', 'name': 'Dogecoin', 'category': 'Crypto'},
  {'symbol': 'AVAX/USDT', 'name': 'Avalanche', 'category': 'Crypto'},
  {'symbol': 'LINK/USDT', 'name': 'Chainlink', 'category': 'Crypto'},
  {'symbol': 'DOT/USDT', 'name': 'Polkadot', 'category': 'Crypto'},
  {'symbol': 'MATIC/USDT', 'name': 'Polygon', 'category': 'Crypto'},
  {'symbol': 'UNI/USDT', 'name': 'Uniswap', 'category': 'Crypto'},
  {'symbol': 'LTC/USDT', 'name': 'Litecoin', 'category': 'Crypto'},
  {'symbol': 'ATOM/USDT', 'name': 'Cosmos', 'category': 'Crypto'},
  {'symbol': 'FIL/USDT', 'name': 'Filecoin', 'category': 'Crypto'},
  {'symbol': 'APT/USDT', 'name': 'Aptos', 'category': 'Crypto'},
  {'symbol': 'ARB/USDT', 'name': 'Arbitrum', 'category': 'Crypto'},
  {'symbol': 'OP/USDT', 'name': 'Optimism', 'category': 'Crypto'},
  {'symbol': 'SUI/USDT', 'name': 'Sui', 'category': 'Crypto'},
  {'symbol': 'INJ/USDT', 'name': 'Injective', 'category': 'Crypto'},
];

/// Shows a bottom sheet for selecting a trading pair.
/// Returns the selected symbol string, or null if dismissed.
Future<String?> showPairSelector(BuildContext context, String current) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: const Color(0xFF161A1E),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (ctx) => _PairSelectorSheet(current: current),
  );
}

class _PairSelectorSheet extends StatefulWidget {
  final String current;
  const _PairSelectorSheet({required this.current});
  @override
  State<_PairSelectorSheet> createState() => _PairSelectorSheetState();
}

class _PairSelectorSheetState extends State<_PairSelectorSheet> {
  final _ctrl = TextEditingController();
  String _query = '';

  List<Map<String, String>> get _filtered {
    if (_query.isEmpty) return kPopularPairs;
    final q = _query.toUpperCase();
    return kPopularPairs
        .where(
          (p) =>
              p['symbol']!.contains(q) || p['name']!.toUpperCase().contains(q),
        )
        .toList();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.65,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      expand: false,
      builder: (_, scrollCtrl) => Column(
        children: [
          // Handle
          const SizedBox(height: 10),
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 14),
          // Title
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Text(
                  'Select Pair',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Search field
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Container(
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFF1E2329),
                borderRadius: BorderRadius.circular(8),
              ),
              child: TextField(
                controller: _ctrl,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: const InputDecoration(
                  hintText: 'Search pairs…',
                  hintStyle: TextStyle(color: Colors.white38, fontSize: 13),
                  prefixIcon: Icon(
                    Icons.search,
                    color: Colors.white38,
                    size: 18,
                  ),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(vertical: 10),
                ),
                onChanged: (v) => setState(() => _query = v.trim()),
              ),
            ),
          ),
          const SizedBox(height: 8),
          // Column headers
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: const [
                Expanded(
                  flex: 3,
                  child: Text(
                    'Pair',
                    style: TextStyle(color: Colors.white38, fontSize: 11),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Text(
                    'Name',
                    style: TextStyle(color: Colors.white38, fontSize: 11),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Colors.white12),
          // List
          Expanded(
            child: ListView.builder(
              controller: scrollCtrl,
              itemCount: _filtered.length,
              itemBuilder: (ctx, i) {
                final pair = _filtered[i];
                final symbol = pair['symbol']!;
                final name = pair['name']!;
                final isCurrent = symbol == widget.current;
                return InkWell(
                  onTap: () => Navigator.pop(ctx, symbol),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    color: isCurrent
                        ? const Color(0xFF00C087).withOpacity(0.06)
                        : Colors.transparent,
                    child: Row(
                      children: [
                        Expanded(
                          flex: 3,
                          child: Row(
                            children: [
                              // Coin icon placeholder
                              Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: pair['category'] == 'Internal'
                                      ? const Color(
                                          0xFF00C087,
                                        ).withOpacity(0.15)
                                      : const Color(0xFF1E2329),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Center(
                                  child: Text(
                                    symbol.split('/').first.substring(0, 1),
                                    style: TextStyle(
                                      color: isCurrent
                                          ? const Color(0xFF00C087)
                                          : pair['category'] == 'Internal'
                                          ? const Color(0xFF00C087)
                                          : Colors.white70,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                symbol,
                                style: TextStyle(
                                  color: isCurrent
                                      ? const Color(0xFF00C087)
                                      : Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              if (isCurrent) ...[
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.check_circle,
                                  color: Color(0xFF00C087),
                                  size: 14,
                                ),
                              ],
                              if (pair['category'] == 'Internal') ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 5,
                                    vertical: 1,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(
                                      0xFF00C087,
                                    ).withOpacity(0.18),
                                    borderRadius: BorderRadius.circular(3),
                                    border: Border.all(
                                      color: const Color(
                                        0xFF00C087,
                                      ).withOpacity(0.4),
                                      width: 0.5,
                                    ),
                                  ),
                                  child: const Text(
                                    'INTERNAL',
                                    style: TextStyle(
                                      color: Color(0xFF00C087),
                                      fontSize: 8,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.4,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        Expanded(
                          flex: 2,
                          child: Text(
                            name,
                            style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
