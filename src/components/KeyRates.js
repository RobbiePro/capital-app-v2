import { db, collection, onSnapshot } from '../services/firebase.js';
import { fetchExchangeRate, fetchStockPrice } from '../services/api.js';

// The function now accepts the 'unsubscribes' array
export function renderKeyRates(container, unsubscribes) {
    container.innerHTML = `
        <div class="key-rates-container">
            <div class="rate-card"><label>שער הדולר</label><span id="usd-rate">טוען...</span></div>
            <div class="rate-card"><label>שער הביטקוין</label><span id="btc-rate">טוען...</span></div>
            <div class="rate-card"><label>שער קנייה ממוצע</label><span id="avg-purchase-rate">טוען...</span></div>
        </div>
    `;

    const today = new Date().toISOString().split('T')[0];
    const usdRateEl = document.getElementById('usd-rate');
    const btcRateEl = document.getElementById('btc-rate');
    const avgPurchaseRateEl = document.getElementById('avg-purchase-rate');

    if (usdRateEl) fetchExchangeRate("USD", today).then(rate => {
        if (usdRateEl) usdRateEl.textContent = rate ? `₪${rate.toFixed(3)}` : 'שגיאה';
    });
    if (btcRateEl) fetchStockPrice("BTC-USD").then(price => {
        if (btcRateEl) btcRateEl.textContent = price ? `$${price.toLocaleString()}` : 'שגיאה';
    });

    // --- NEW: Add the 'unsub' function to our cleanup list ---
    const unsubInvestments = onSnapshot(collection(db, "investments"), (investmentsSnapshot) => {
        let totalILS = 0;
        let totalUSD = 0;
        investmentsSnapshot.forEach(doc => {
            const inv = doc.data();
            if (inv.status === 'open' && inv.totalCostILS && inv.purchaseRateILS) {
                const costUSD = inv.totalCostILS / inv.purchaseRateILS;
                totalILS += inv.totalCostILS;
                totalUSD += costUSD;
            }
        });
        const avgRate = totalUSD > 0 ? (totalILS / totalUSD) : 0;
        if (avgPurchaseRateEl) avgPurchaseRateEl.textContent = avgRate > 0 ? `₪${avgRate.toFixed(3)}` : 'N/A';
    });
    unsubscribes.push(unsubInvestments);
}