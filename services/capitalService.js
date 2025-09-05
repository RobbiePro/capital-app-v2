// services/capitalService.js
import { db, getDocs, query, collection, orderBy, limit } from './firebase.js';
import { fetchStockPrice, fetchExchangeRate } from './api.js';

let capitalDataCache = null;
let cacheTimestamp = 0;
const CACHE_VALIDITY_MS = 2000; // 2 seconds

export async function calculateTotalCapital() {
    const now = Date.now();
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

    try {
        const [
            manualAssetsSnapshot, cashSnapshot, cashboxSnapshot,
            investmentsSnapshot
        ] = await Promise.all([
            getDocs(collection(db, "manualAssets")),
            getDocs(query(collection(db, "cashMeasurements"), orderBy('timestamp', 'desc'), limit(1))),
            getDocs(collection(db, "cashboxTransactions")),
            getDocs(collection(db, "investments"))
        ]);

        manualAssetsSnapshot.forEach(doc => {
            const asset = doc.data();
            const value = asset.value || 0;
            picture.manualAssetsTotal += value;
        });

        if (!cashSnapshot.empty) { picture.cashTotal = cashSnapshot.docs[0].data().totalILS || 0; }

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
                if (livePrice && currentRateUSD_ILS) {
                    const marketValueUSD = holdings[symbol].quantity * livePrice;
                    picture.holdingsMarketValueUSD += marketValueUSD;
                    picture.holdingsMarketValueILS += marketValueUSD * currentRateUSD_ILS;
                }
            }
            picture.totalInvestedCostILS += holdings[symbol].totalCostILS;
            picture.totalInvestedCostUSD += holdings[symbol].totalCostUSD;
        }

        picture.availableCashInBrokerage = cashboxDepositsAndWithdrawals - picture.totalInvestedCostILS;
        if (currentRateUSD_ILS) {
            picture.availableCashInBrokerageUSD = picture.availableCashInBrokerage / currentRateUSD_ILS;
        }
        
        picture.investmentsTotal = picture.availableCashInBrokerage + picture.holdingsMarketValueILS;
        picture.investmentsTotalUSD = picture.availableCashInBrokerageUSD + picture.holdingsMarketValueUSD;
        
        picture.totalProfitLossILS = picture.holdingsMarketValueILS - picture.totalInvestedCostILS;
        picture.totalProfitLossUSD = picture.holdingsMarketValueUSD - picture.totalInvestedCostUSD;
        
        picture.grandTotal = picture.manualAssetsTotal + picture.cashTotal + picture.investmentsTotal;

        capitalDataCache = picture;
        cacheTimestamp = now;

        return picture;

    } catch (error) {
        console.error("A critical error occurred in calculateTotalCapital:", error);
        return picture; // Return the default picture object on error
    }
}
