import { db, addDoc, onSnapshot, query, collection, orderBy, cashMeasurementsCollection } from '../services/firebase.js';
import { fetchExchangeRate } from '../services/api.js';
import { createCurrencyRow } from './CurrencyRow.js';

export function renderCashTab(container, unsubscribes) {
    container.innerHTML = `
        <div class="wallet-container">
            <div class="tab-header">
                <h2><i class="fas fa-wallet"></i> ארנק</h2>
            </div>
            <form id="new-measurement-form">
                <div id="current-measurement-area"></div>
                <button type="button" id="add-currency-btn" class="add-button secondary"><i class="fas fa-plus"></i><span>הוסף מטבע</span></button>
                <button type="submit" id="save-measurement-btn" class="add-button">שמור מדידה</button>
            </form>
            <div id="last-measurement-section" class="history-section"><h4>מדידה אחרונה:</h4><div id="last-measurement-details"><p>טוען...</p></div></div>
            <div class="history-section"><h3>היסטוריית מדידות</h3><div id="measurement-history-list"><p>טוען...</p></div></div>
        </div>
    `;

    const measurementArea = document.getElementById('current-measurement-area');
    const addCurrencyBtn = document.getElementById('add-currency-btn');
    const form = document.getElementById('new-measurement-form');
    const lastMeasurementDetails = document.getElementById('last-measurement-details');
    const historyList = document.getElementById('measurement-history-list');
    const availableCurrencies = ['ILS', 'USD', 'EUR', 'THB', 'PHP', 'AED', 'TRY', 'אחר'];
    
    measurementArea.appendChild(createCurrencyRow('USD', availableCurrencies));

    async function updateILSValue(row) {
        const amountInput = row.querySelector('.amount-input');
        const currencySelect = row.querySelector('.currency-select');
        const tickerInput = row.querySelector('.currency-ticker-input');
        const ilsValueSpan = row.querySelector('.ils-value');
        const manualRateInput = row.querySelector('.manual-rate-input');
        const amount = parseFloat(amountInput.value);
        let currency = currencySelect.value;
        const manualRate = parseFloat(manualRateInput.value);

        if (currency === 'אחר') currency = tickerInput.value.toUpperCase();

        manualRateInput.style.display = 'none';
        ilsValueSpan.style.display = 'inline-block';

        if (!amount || isNaN(amount) || !currency) {
            ilsValueSpan.textContent = '₪...';
            return;
        }
        if (currency === 'ILS') {
            ilsValueSpan.textContent = `₪${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const rate = await fetchExchangeRate(currency, today);

        if (rate) {
            const ilsValue = amount * rate;
            ilsValueSpan.textContent = `₪${ilsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
            ilsValueSpan.style.display = 'none';
            manualRateInput.style.display = 'inline-block';
            if (!isNaN(manualRate) && manualRate > 0) {
                const ilsValue = amount * manualRate;
                ilsValueSpan.textContent = `~ ₪${ilsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                ilsValueSpan.style.display = 'inline-block';
            }
        }
    }

    addCurrencyBtn.addEventListener('click', () => {
        measurementArea.appendChild(createCurrencyRow('EUR', availableCurrencies));
    });
    
    measurementArea.addEventListener('input', e => { if (e.target.closest('.currency-row')) updateILSValue(e.target.closest('.currency-row')); });
    measurementArea.addEventListener('change', e => { if (e.target.classList.contains('currency-select')) updateILSValue(e.target.closest('.currency-row')); });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const measurement = { date: new Date().toISOString().split('T')[0], timestamp: new Date(), currencies: [], totalILS: 0 };
        const rows = measurementArea.querySelectorAll('.currency-row');
        let allRowsValid = true;

        for (const row of rows) {
            const amount = parseFloat(row.querySelector('.amount-input').value) || 0;
            let currency = row.querySelector('.currency-select').value;
            if (currency === 'אחר') currency = row.querySelector('.currency-ticker-input').value.toUpperCase();
            
            const manualRate = parseFloat(row.querySelector('.manual-rate-input').value) || 0;
            let ilsValue = parseFloat(row.querySelector('.ils-value').textContent.replace(/[₪,~]/g, '')) || 0;

            if (manualRate > 0) ilsValue = amount * manualRate;

            if (amount > 0 && currency) {
                if (ilsValue > 0) {
                     measurement.currencies.push({ currency, amount, ilsValue });
                     measurement.totalILS += ilsValue;
                } else {
                    allRowsValid = false;
                }
            }
        }

        if (!allRowsValid) {
            alert('נא להזין שער חליפין ידני עבור מטבעות שלא נמצאו באופן אוטומטי.');
            return;
        }
        if (measurement.currencies.length === 0) {
            alert('נא להזין לפחות מטבע אחד.');
            return;
        }

        try {
            await addDoc(cashMeasurementsCollection, measurement);
            alert('המדידה נשמרה בהצלחה!');
            measurementArea.innerHTML = '';
            measurementArea.appendChild(createCurrencyRow('USD', availableCurrencies));
        } catch (error) { console.error("Error saving measurement: ", error); alert('שגיאה בשמירת המדידה.'); }
    });

    const historyQuery = query(cashMeasurementsCollection, orderBy("timestamp", "desc"));
    const unsubHistory = onSnapshot(historyQuery, (snapshot) => {
        const measurements = snapshot.docs.map(doc => doc.data());
        if (measurements.length > 0) {
            const last = measurements[0];
            let lastHtml = last.currencies.map(item => `
                <div class="measurement-item">
                    <span class="currency-name">${item.currency}</span>
                    <span class="currency-amount">${item.amount.toLocaleString()}</span>
                    <span class="currency-ils-value">₪${item.ilsValue.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
                </div>
            `).join('');
            lastHtml += `<div class="measurement-total"><span>סה"כ</span><span>₪${last.totalILS.toLocaleString('en-US', {maximumFractionDigits: 0})}</span></div>`;
            lastMeasurementDetails.innerHTML = lastHtml;
            historyList.innerHTML = measurements.map(m => {
                const date = new Date(m.timestamp.toDate()).toLocaleDateString('he-IL');
                return `<div class="history-item"><span>${date}</span><span>₪${m.totalILS.toLocaleString('en-US', {maximumFractionDigits: 0})}</span></div>`;
            }).join('');
        } else {
            lastMeasurementDetails.innerHTML = '<p>עדיין לא בוצעו מדידות.</p>';
            historyList.innerHTML = '';
        }
    });
    unsubscribes.push(unsubHistory);
}