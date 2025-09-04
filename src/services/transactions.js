import { db, collection, query, where, getDocs, orderBy, addDoc, doc } from './firebase.js';

const CAPITAL_GAINS_TAX_RATE = 0.25; // 25%

/**
 * NEW IMMUTABLE LOGIC for selling a stock.
 * This function creates a new 'sell' record and NEVER modifies the original purchase.
 * @param {string} symbol The stock symbol to sell.
 * @param {number} quantityToSell The number of shares to sell.
 * @param {number} sellPrice The price per share.
 * @param {string} sellDate The date of the sale.
 * @param {number} fees Any fees associated with the sale.
 */
export async function handleSellTransaction(symbol, quantityToSell, sellPrice, sellDate, fees) {
    // First, verify the user has enough shares to sell.
    const holdingsQuery = query(collection(db, "investments"), where("symbol", "==", symbol));
    try {
        const snapshot = await getDocs(holdingsQuery);
        let totalBought = 0;
        let totalSold = 0;
        let oldestPurchase = null;

        snapshot.forEach(doc => {
            const trans = doc.data();
            if (trans.status === 'open') { // A buy transaction
                totalBought += trans.quantity;
                // Find the oldest purchase for profit calculation (FIFO)
                if (!oldestPurchase || trans.timestamp.toDate() < oldestPurchase.timestamp.toDate()) {
                    oldestPurchase = trans;
                }
            } else { // A sell transaction
                totalSold += trans.quantity;
            }
        });

        if ((totalBought - totalSold) < quantityToSell) {
            alert(`שגיאה: אתה מנסה למכור ${quantityToSell} יחידות, אך ברשותך רק ${totalBought - totalSold} יחידות.`);
            return false;
        }

        // We have enough shares. Now, create the sale record.
        // For profit calculation, we use the price from the oldest open position (FIFO).
        const profit = (sellPrice - oldestPurchase.purchasePrice) * quantityToSell;
        const capitalGainsTax = profit > 0 ? profit * CAPITAL_GAINS_TAX_RATE : 0;
        
        const saleData = {
            symbol: symbol,
            quantity: quantityToSell,
            purchasePrice: oldestPurchase.purchasePrice, // Store the cost basis for this sale
            sellPrice: sellPrice,
            sellDate: sellDate,
            fees: fees,
            capitalGainsTax: capitalGainsTax,
            status: 'closed', // This is a sell/closed transaction
            timestamp: new Date()
        };

        await addDoc(collection(db, "investments"), saleData);
        alert('המכירה עודכנה בהצלחה!');
        return true;

    } catch (error) {
        console.error("Error handling sell transaction: ", error);
        alert('אירעה שגיאה בעת ביצוע המכירה.');
        return false;
    }
}