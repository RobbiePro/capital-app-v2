// components/Records.js

// NOTE: We have removed the imports for services, as this component no longer fetches data.

export function renderRecords(container, records, capitalData) {
    const card = document.createElement('div');
    card.className = 'records-card';

    if (!records || !capitalData) {
        card.innerHTML = `<p>טוען שיאים...</p>`;
        container.innerHTML = '';
        container.appendChild(card);
        return;
    }

    const formatRecord = (label, record, currency, isPositive) => {
        if (!record || record.value === -Infinity || record.value === Infinity) {
            return '';
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
    
    container.innerHTML = '';
    container.appendChild(card);
}