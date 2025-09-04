// components/Records.js
import { updateAndFetchRecords } from '../services/recordsService.js';
import { calculateTotalCapital } from '../services/capitalService.js';

export function renderRecords(container) {
    container.innerHTML = `<div class="records-card"><p>טוען שיאים...</p></div>`;

    async function updateView() {
        const records = await updateAndFetchRecords();
        const capitalData = await calculateTotalCapital();
        const card = container.querySelector('.records-card');

        // Helper to format the record row
        const formatRecord = (label, record, currency, isPositive) => {
            if (record.value === -Infinity || record.value === Infinity) {
                return ''; // Don't show if no record exists yet
            }
            const value = Math.round(record.value).toLocaleString();
            const date = new Date(record.date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
            const currencySymbol = currency === 'ILS' ? '₪' : '$';
            const colorClass = isPositive ? 'profit-positive' : 'profit-negative';

            return `
                <div class="record-item">
                    <span>${label} (${date})</span>
                    <span class="${colorClass}">${currencySymbol}${value}</span>
                </div>
            `;
        };

        const distanceFromPeakILS = Math.round(capitalData.totalProfitLossILS - records.peakProfitILS.value);
        const distanceFromPeakUSD = Math.round(capitalData.totalProfitLossUSD - records.peakProfitUSD.value);

        card.innerHTML = `
            <h4>שיאים</h4>
            ${formatRecord('שיא רווח', records.peakProfitILS, 'ILS', true)}
            ${formatRecord('שפל רווח', records.troughProfitILS, 'ILS', false)}
            <div class="record-item separator">
                <span>מרחק מהשיא (₪)</span>
                <span class="profit-negative">₪${distanceFromPeakILS.toLocaleString()}</span>
            </div>
            ${formatRecord('שיא רווח', records.peakProfitUSD, 'USD', true)}
            ${formatRecord('שפל רווח', records.troughProfitUSD, 'USD', false)}
            <div class="record-item">
                <span>מרחק מהשיא ($)</span>
                <span class="profit-negative">$${distanceFromPeakUSD.toLocaleString()}</span>
            </div>
        `;
    }

    updateView();
}