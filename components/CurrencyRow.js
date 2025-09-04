// components/CurrencyRow.js

/**
 * Creates the HTML for a single currency row in the Cash tab.
 * @param {string} defaultCurrency - The default currency to select.
 * @param {Array<string>} currencyOptions - An array of currency codes for the dropdown.
 * @returns {HTMLElement} The created row element.
 */
export function createCurrencyRow(defaultCurrency, currencyOptions) {
    const row = document.createElement('div');
    row.className = 'currency-row';

    // Create the currency dropdown (<select>) element
    const select = document.createElement('select');
    select.className = 'currency-select';
    
    currencyOptions.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency;
        option.textContent = currency;
        if (currency === defaultCurrency) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    row.innerHTML = `
        <input type="number" class="amount-input" placeholder="סכום">
        <div class="select-wrapper">
            ${select.outerHTML}
            <input type="text" class="currency-ticker-input" placeholder="סימול" style="display: none;">
        </div>
        <span class="ils-value">₪...</span>
        <input type="number" step="0.001" class="manual-rate-input" placeholder="הזן שער" style="display: none;">
    `;

    // --- NEW LOGIC TO SHOW/HIDE THE MANUAL TICKER INPUT ---
    const currencySelect = row.querySelector('.currency-select');
    const tickerInput = row.querySelector('.currency-ticker-input');
    
    currencySelect.addEventListener('change', () => {
        if (currencySelect.value === 'אחר') {
            tickerInput.style.display = 'inline-block';
        } else {
            tickerInput.style.display = 'none';
        }
    });
    
    return row;
}