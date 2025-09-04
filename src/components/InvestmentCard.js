/**
 * Creates and returns the HTML string for a single, aggregated investment card.
 * @param {object} cardData - An object containing all the calculated data for one stock.
 * @returns {string} - The HTML string for the investment card.
 */
export function createInvestmentCard(cardData) {
    const {
        symbol,
        totalQuantity,
        totalCostUSD,
        totalCostILS,
        currentValueUSD,
        currentValueILS,
        profitLossUSD,
        profitLossILS,
        profitLossPercentageUSD,
        profitLossPercentageILS
    } = cardData;

    // Determine the color class based on profit or loss
    const profitClass = profitLossUSD >= 0 ? 'profit-positive' : 'profit-negative';

    return `
        <div class="investment-card">
            <h3>${symbol} <span class="quantity">(${totalQuantity} יח')</span></h3>
            <div class="financial-details">
                <div class="details-column">
                    <p><strong>עלות כוללת:</strong> $${totalCostUSD.toLocaleString()}</p>
                    <p><strong>שווי נוכחי:</strong> $${currentValueUSD.toLocaleString()}</p>
                    <p class="profit ${profitClass}">
                        <strong>רווח/הפסד:</strong> 
                        $${profitLossUSD.toLocaleString()} (${profitLossPercentageUSD}%)
                    </p>
                </div>
                <div class="details-column">
                    <p><strong>עלות כוללת:</strong> ₪${totalCostILS.toLocaleString()}</p>
                    <p><strong>שווי נוכחי:</strong> ₪${currentValueILS.toLocaleString()}</p>
                    <p class="profit ${profitClass}">
                        <strong>רווח/הפסד:</strong> 
                        ₪${profitLossILS.toLocaleString()} (${profitLossPercentageILS}%)
                    </p>
                </div>
            </div>
        </div>
    `;
}