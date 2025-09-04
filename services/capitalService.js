// services/capitalService.js
import { db, getDocs, query, collection, orderBy, limit } from './firebase.js';
import { fetchStockPrice, fetchExchangeRate } from './api.js';

// --- NEW CACHING LAYER FOR THE ENTIRE FUNCTION ---
let capitalDataCache = null;
let cacheTimestamp = 0;
const CACHE_VALIDITY_MS = 2000; // 2 seconds

export async function calculateTotalCapital() {
    const now = Date.now();

    // If a fresh result exists from the last 2 seconds, return it instantly.
    if (capitalDataCache && (now - cacheTimestamp < CACHE_VALIDITY_MS)) {
        return capitalDataCache;
    }

    const picture = {
        manualAssetsTotal: 0,
        manualAssetsGrouped: {},
        cashTotal: 0,
        availableCashInBrokerage: 0,
        holdingsMarketValueILS: 0,
        totalInvestedCostILS: 0,
        totalProfitLossILS: 0,
        investmentsTotal: 0,
        grandTotal: 0,
        holdingsMarketValueUSD: 0,
        totalInvestedCostUSD: 0,
        totalProfitLossUSD: 0,
        availableCashInBrokerageUSD: 0,
        investmentsTotalUSD: 0
    };

    const [
        manualAssetsSnapshot, cashSnapshot, cashboxSnapshot,
        investmentsSnapshot
    ] = await Promise.all([
        getDocs(collection(db, "manualAssets")),
        getDocs(query(collection(db, "cashMeasurements"), orderBy('timestamp', 'desc'), limit(1))),
        getDocs(collection(db, "cashboxTransactions")),
        getDocs(collection(db, "investments"))
    ]);

    // --- Basic Totals ---
    manualAssetsSnapshot.forEach(doc => {
        const asset = doc.data();
        const value = asset.value || 0;
        const category = asset.category || "ללא קטגוריה";
        picture.manualAssetsTotal += value;
        
        if (value > 0) {
            if (!picture.manualAssetsGrouped[category]) {
                picture.manualAssetsGrouped[category] = { total: 0, items: [] };
            }
            picture.manualAssetsGrouped[category].total += value;
            picture.manualAssetsGrouped[category].items.push({ name: asset.name, value: value });
        }
    });

    for (const category in picture.manualAssetsGrouped) {
        // --- THIS IS THE CORRECTED LINE (removed the extra period) ---
        picture.manualAssetsGrouped[category].items.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (!cashSnapshot.empty) { picture.cashTotal = cashSnapshot.docs[0].data().totalILS; }

    // --- Investment Calculations ---
    let cashboxDepositsAndWithdrawals = 0;
    cashboxSnapshot.forEach(doc => {
        cashboxDepositsAndWithdrawals += (doc.data().type === 'deposit' ? doc.data().amount : -doc.data().amount);
    });
    const today = new Date().toISOString().split('T')[0];
    const currentRateUSD_ILS = await fetchExchangeRate("USD", today);
    const holdings = {};
    investmentsSnapshot.forEach(doc => {
        const inv = doc.data();
        if (!holdings[inv.symbol]) {
            holdings[inv.symbol] = { quantity: 0, totalCostILS: 0, totalCostUSD: 0 };
        }
        if (inv.status === 'open') {
            holdings[inv.symbol].quantity += inv.quantity;
            holdings[inv.symbol].totalCostILS += inv.totalCostILS || 0;
            holdings[inv.symbol].totalCostUSD += (inv.totalCostILS / inv.purchaseRateILS) || 0;
        } else {
            holdings[inv.symbol].quantity -= inv.quantity;
        }
    });
    for (const symbol in holdings) {
        if (holdings[symbol].quantity > 0) {
            const livePrice = await fetchStockPrice(symbol);
            if (livePrice) {
                const marketValueUSD = holdings[symbol].quantity * livePrice;
                picture.holdingsMarketValueUSD += marketValueUSD;
                if (currentRateUSD_ILS) {
                    picture.holdingsMarketValueILS += marketValueUSD * currentRateUSD_ILS;
                }
            }
        }
        picture.totalInvestedCostILS += holdings[symbol].totalCostILS;
        picture.totalInvestedCostUSD += holdings[symbol].totalCostUSD;
    }
    picture.availableCashInBrokerage = cashboxDepositsAndWithdrawals - picture.totalInvestedCostILS;
    picture.totalProfitLossILS = picture.holdingsMarketValueILS - picture.totalInvestedCostILS;
    picture.totalProfitLossUSD = picture.holdingsMarketValueUSD - picture.totalInvestedCostUSD;
    picture.investmentsTotal = picture.availableCashInBrokerage + picture.holdingsMarketValueILS;
    if (currentRateUSD_ILS) {
        picture.availableCashInBrokerageUSD = picture.availableCashInBrokerage / currentRateUSD_ILS;
    }
    picture.investmentsTotalUSD = picture.availableCashInBrokerageUSD + picture.holdingsMarketValueUSD;
    picture.grandTotal = picture.manualAssetsTotal + picture.cashTotal + picture.investmentsTotal;
    
    // --- NEW: Save the result to the cache before returning ---
    capitalDataCache = picture;
    cacheTimestamp = now;

    return picture;
}