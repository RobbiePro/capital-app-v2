// components/PerformanceSnapshot.js

/**
 * A component to visualize the current profit against its peak, and show recent momentum.
 * @param {object} props - The component's properties.
 * @param {number} props.currentProfit - The current total profit/loss in ILS.
 * @param {number} props.peakProfit - The all-time peak profit in ILS.
 * @param {number} props.previousProfit - The profit from the last session in ILS.
 * @returns {string} - The HTML string for the component.
 */
export function PerformanceSnapshot({ currentProfit, peakProfit, previousProfit }) {
    // --- Data Sanitization ---
    // Ensure we are working with valid numbers. Default to 0 if data is missing.
    const current = Math.round(currentProfit || 0);
    const peak = Math.round(peakProfit || 0);
    const previous = Math.round(previousProfit || 0);

    // --- Momentum Calculation ---
    const delta = current - previous;
    const momentumClass = delta >= 0 ? 'profit-positive' : 'profit-negative';
    const momentumArrow = delta >= 0 ? '▲' : '▼';
    const formattedDelta = `${delta >= 0 ? '+' : ''}${delta.toLocaleString()}`;

    // --- Bar Calculation Logic ---
    let blueBarWidth = '100%';
    let dynamicBarHtml;

    if (current >= 0) {
        // --- PROFIT SCENARIO ---
        // Zero is on the right, bars grow to the left.
        // Scale is based on the peak profit.
        const greenBarWidth = peak > 0 ? ((current / peak) * 100).toFixed(2) : 0;
        dynamicBarHtml = `
            <div class="bar-label">הרווח כרגע ₪${current.toLocaleString()}</div>
            <div class="bar green-bar" style="width: ${greenBarWidth}%;"></div>
        `;
    } else {
        // --- LOSS SCENARIO ---
        // Zero is the divider between blue and red bars.
        // Scale is the total range from the loss to the peak.
        const totalRange = peak + Math.abs(current);
        const blueBarPercentage = totalRange > 0 ? ((peak / totalRange) * 100).toFixed(2) : 50;
        const redBarPercentage = totalRange > 0 ? ((Math.abs(current) / totalRange) * 100).toFixed(2) : 50;

        blueBarWidth = `${blueBarPercentage}%`; // Override the blue bar width
        dynamicBarHtml = `
             <div class="bar-label loss-label">ההפסד כרגע ₪${current.toLocaleString()}</div>
             <div class="bar red-bar" style="width: ${redBarPercentage}%;"></div>
        `;
    }

    return `
        <div class="performance-snapshot-card">
            <div class="bars-container ${current < 0 ? 'loss-mode' : ''}">
                <div class="bar-row">
                    <div class="bar-label">שיא כל הזמנים ₪${peak.toLocaleString()}</div>
                    <div class="bar blue-bar" style="width: ${blueBarWidth};"></div>
                </div>
                <div class="bar-row">
                    ${dynamicBarHtml}
                </div>
            </div>
            <div class="momentum-container">
                <div class="momentum-box ${momentumClass}">
                    <div class="momentum-arrow">${momentumArrow}</div>
                    <div class="momentum-delta">₪${formattedDelta}</div>
                    <div class="momentum-label">מהביקור האחרון</div>
                </div>
            </div>
        </div>
    `;
}