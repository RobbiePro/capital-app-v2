import { db, onSnapshot, collection, query, where } from '../services/firebase.js';
import { fetchStockPrice, fetchExchangeRate } from '../services/api.js';
import { createInvestmentCard } from './InvestmentCard.js';
import { renderTransactionList } from './TransactionList.js';

export function renderHoldingsList(container) {
    const q = query(collection(db, "investments"));

    onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = '<h2>ההחזקות שלי:</h2><p>עדיין לא הוספת עסקאות.</p>';
            return;
        }

        const holdings = snapshot.docs.reduce((acc, doc) => {
            const investment = doc.data();
            if (!acc[investment.symbol]) {
                acc[investment.symbol] = { buys: [], sells: [] };
            }
            if (investment.status === 'open') {
                acc[investment.symbol].buys.push(investment);
            } else {
                acc[investment.symbol].sells.push(investment);
            }
            return acc;
        }, {});

        const today = new Date().toISOString().split('T')[0];
        const currentRateUSD_ILS = await fetchExchangeRate("USD", today);

        let finalHTML = '<h2>ההחזקות שלי:</h2>';

        for (const symbol in holdings) {
            const { buys, sells } = holdings[symbol];
            
            const totalBought = buys.reduce((sum, trans) => sum + trans.quantity, 0);
            const totalSold = sells.reduce((sum, trans) => sum + trans.quantity, 0);
            const totalQuantity = totalBought - totalSold;

            if (totalQuantity <= 0) continue;

            const currentPriceUSD = await fetchStockPrice(symbol);
            
            // --- THIS IS THE CORRECTED LOGIC ---
            // We now read the pre-calculated ILS cost directly from the database records
            const totalCostILS = buys.reduce((sum, trans) => sum + (trans.totalCostILS || 0), 0);
            
            // We still calculate the USD cost for display purposes
            const totalCostUSD = buys.reduce((sum, trans) => sum + (trans.purchasePrice * trans.quantity) + (trans.fees || 0), 0);
            const avgCostUSD = totalBought > 0 ? totalCostUSD / totalBought : 0;
            const currentCostBasisUSD = avgCostUSD * totalQuantity;
            
            const currentValueUSD = currentPriceUSD ? currentPriceUSD * totalQuantity : 0;
            const profitLossUSD = currentValueUSD - currentCostBasisUSD;
            const profitLossPercentageUSD = currentCostBasisUSD > 0 ? ((profitLossUSD / currentCostBasisUSD) * 100).toFixed(2) : 0;
            
            const currentValueILS = currentValueUSD * currentRateUSD_ILS;
            const profitLossILS = currentValueILS - totalCostILS;
            const profitLossPercentageILS = totalCostILS > 0 ? ((profitLossILS / totalCostILS) * 100).toFixed(2) : 0;
            
            const cardData = { symbol, totalQuantity, totalCostUSD: currentCostBasisUSD, totalCostILS, currentValueUSD, currentValueILS, profitLossUSD, profitLossILS, profitLossPercentageUSD, profitLossPercentageILS };
            
            finalHTML += `<div class="holding-container" data-symbol="${symbol}">${createInvestmentCard(cardData)}</div>`;
        }
        
        container.innerHTML = finalHTML;

        // Add click listener (unchanged)
        container.addEventListener('click', (event) => {
            const cardContainer = event.target.closest('.holding-container');
            if (!cardContainer) return;
            const existingDetails = cardContainer.querySelector('.transaction-details-container');
            if (existingDetails) {
                existingDetails.remove();
            } else {
                const detailsContainer = document.createElement('div');
                detailsContainer.className = 'transaction-details-container';
                cardContainer.appendChild(detailsContainer);
                const symbol = cardContainer.dataset.symbol;
                renderTransactionList(detailsContainer, symbol);
            }
        });
    });
}