import axios from 'axios';

const CRYPTOCOMPARE_COIN_LIST_URL = 'https://min-api.cryptocompare.com/data/all/coinlist?summary=true';
const CRYPTOCOMPARE_IMAGE_BASE_URL = 'https://www.cryptocompare.com';

type CryptoCompareCoinRow = {
  Symbol?: string;
  ImageUrl?: string;
  ImageURL?: string;
};

type CryptoCompareCoinListResponse = {
  Data?: Record<string, CryptoCompareCoinRow>;
};

let cachedImageCatalog: Record<string, string> | null = null;
let inFlightCatalogRequest: Promise<Record<string, string>> | null = null;

export const normalizeCoinSymbol = (symbol: string) =>
  (() => {
    const cleaned = String(symbol || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    if (!cleaned) return '';
    if (cleaned === 'USDT') return 'USDT';
    if (cleaned.endsWith('USDT') && cleaned.length > 4) {
      return cleaned.slice(0, -4);
    }
    return cleaned;
  })();

const fallbackImageUrl = (symbol: string) => {
  const normalized = normalizeCoinSymbol(symbol).toLowerCase();
  if (!normalized) return '';
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${normalized}.png`;
};

const toAbsoluteImageUrl = (imagePath: string) => {
  if (!imagePath) return '';
  return imagePath.startsWith('http') ? imagePath : `${CRYPTOCOMPARE_IMAGE_BASE_URL}${imagePath}`;
};

const parseImageCatalog = (payload: CryptoCompareCoinListResponse) => {
  const rows = payload?.Data || {};
  const nextCatalog: Record<string, string> = {};

  Object.entries(rows).forEach(([rowSymbol, row]) => {
    const symbol = normalizeCoinSymbol(row?.Symbol || rowSymbol);
    const imagePath = String(row?.ImageUrl || row?.ImageURL || '');
    const imageUrl = toAbsoluteImageUrl(imagePath);
    if (symbol && imageUrl) {
      nextCatalog[symbol] = imageUrl;
    }
  });

  return nextCatalog;
};

const fetchImageCatalog = async () => {
  const response = await axios.get<CryptoCompareCoinListResponse>(CRYPTOCOMPARE_COIN_LIST_URL, {
    timeout: 15000,
  });
  return parseImageCatalog(response.data);
};

const ensureImageCatalog = async () => {
  if (cachedImageCatalog) return cachedImageCatalog;

  if (!inFlightCatalogRequest) {
    inFlightCatalogRequest = fetchImageCatalog()
      .then((catalog) => {
        cachedImageCatalog = catalog;
        return catalog;
      })
      .catch(() => {
        cachedImageCatalog = {};
        return cachedImageCatalog;
      })
      .finally(() => {
        inFlightCatalogRequest = null;
      });
  }

  return inFlightCatalogRequest;
};

export const getCoinImageMap = async (symbols: string[]) => {
  const normalizedSymbols = Array.from(
    new Set(
      (symbols || [])
        .map((symbol) => normalizeCoinSymbol(symbol))
        .filter(Boolean)
    )
  );

  if (normalizedSymbols.length === 0) {
    return {};
  }

  const catalog = await ensureImageCatalog();
  const resolved: Record<string, string> = {};

  normalizedSymbols.forEach((symbol) => {
    const url = catalog[symbol] || fallbackImageUrl(symbol);
    if (url) {
      resolved[symbol] = url;
    }
  });

  return resolved;
};
