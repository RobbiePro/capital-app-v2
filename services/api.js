// --- NEW: Configuration for Finnhub (for stocks) ---
const FINNHUB_API_KEY = "d2t1o0pr01qkuv3iu840d2t1o0pr01qkuv3iu84g";
const CACHE_DURATION_MINUTES = 15;

// Caching mechanisms (no changes needed here)
const inMemoryStockCache = {};
const pendingRequests = {};

// --- NEW: A dedicated function for fetching Bitcoin price from CoinGecko ---
// (This function remains unchanged)
async function fetchBitcoinPriceFromCoinGecko() {
    // ... (no changes in this function)
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`Could not retrieve Bitcoin price from CoinGecko. Status: ${response.status}`);
            return null;
        }
        const data = await response.json();
        if (data && data.bitcoin && data.bitcoin.usd) {
            return data.bitcoin.usd;
        } else {
            console.warn('CoinGecko API returned no price data for Bitcoin.', data);
            return null;
        }
    } catch (error) {
        console.error('Error fetching Bitcoin price from CoinGecko:', error);
        return null;
    }
}


/**
 * Fetches the latest stock price for a given symbol.
 * It now uses CoinGecko for Bitcoin and Finnhub for everything else.
 */
export async function fetchStockPrice(symbol) {
    if (!symbol) return null;

    const now = new Date().getTime();
    const cacheDuration = CACHE_DURATION_MINUTES * 60 * 1000;

    // 1. Check cache (no changes needed here)
    if (inMemoryStockCache[symbol] && (now - inMemoryStockCache[symbol].timestamp < cacheDuration)) {
        return inMemoryStockCache[symbol].price;
    }
    const storageKey = `price_${symbol}`;
    const storedItem = localStorage.getItem(storageKey);
    if (storedItem) {
        const cachedData = JSON.parse(storedItem);
        if (now - cachedData.timestamp < cacheDuration) {
            inMemoryStockCache[symbol] = cachedData;
            return cachedData.price;
        }
    }
    if (pendingRequests[symbol]) {
        return await pendingRequests[symbol];
    }

    // --- THIS IS THE HYBRID LOGIC WITH FINNHUB ---
    const fetchPromise = (async () => {
        let price = null;
        // If the symbol is BTC-USD, use the special CoinGecko function
        if (symbol === 'BTC-USD') {
            price = await fetchBitcoinPriceFromCoinGecko();
        } else {
            // --- NEW FINNHUB LOGIC ---
            // Otherwise, use the new Finnhub logic for stocks
            try {
                const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
                const response = await fetch(url);
                if (!response.ok) {
                    console.warn(`Could not retrieve price for ${symbol} from Finnhub. Status: ${response.status}`);
                    return null;
                }
                const data = await response.json();
                // Finnhub returns the current price in the 'c' field.
                // It might return 0 if the market is closed, so we check for that.
                if (data && data.c !== undefined && data.c !== null) {
                    price = data.c;
                } else {
                    console.warn(`Finnhub API returned no price data for ${symbol}.`, data);
                }
            } catch (error) {
                console.error(`Error fetching stock price for ${symbol} from Finnhub:`, error);
            }
        }

        // --- Caching the result, regardless of the source (no changes here) ---
        if (price !== null) {
            const newCacheData = { price: price, timestamp: now };
            inMemoryStockCache[symbol] = newCacheData;
            localStorage.setItem(storageKey, JSON.stringify(newCacheData));
            delete pendingRequests[symbol];
            return price;
        } else {
            delete pendingRequests[symbol];
            return null;
        }
    })();
    
    pendingRequests[symbol] = fetchPromise;
    return await fetchPromise;
}

/**
 * Fetches the exchange rate. This function remains unchanged.
 */
export async function fetchExchangeRate(fromCurrency, dateString) {
    // ... (no changes in this function)
    if (!fromCurrency) return null;
    const cacheKey = `${fromCurrency}_${dateString}`;
    const exchangeRateCache = {}; 

    if (exchangeRateCache[cacheKey]) {
        return exchangeRateCache[cacheKey];
    }

    const isToday = new Date(dateString).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
    const dateForUrl = isToday ? 'latest' : dateString;
    const url = new URL(`https://api.frankfurter.app/${dateForUrl}`);
    url.searchParams.append('from', fromCurrency.toUpperCase());
    url.searchParams.append('to', 'ILS');

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (response.ok && data.rates && data.rates.ILS) {
            const rate = data.rates.ILS;
            exchangeRateCache[cacheKey] = rate;
            return rate;
        } else {
            console.warn(`Could not retrieve exchange rate for ${fromCurrency}.`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching exchange rate for ${fromCurrency}:`, error);
        return null;
    }
}