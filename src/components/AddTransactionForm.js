import { addDoc, investmentsCollection } from '../services/firebase.js';
import { fetchExchangeRate } from '../services/api.js';

export function renderAddTransactionForm(container) {
    const formElement = document.createElement('form');
    // ... (rest of the innerHTML is the same as before)
    formElement.id = 'add-stock-form';
    formElement.className = 'styled-form';

    formElement.innerHTML = `
        <div class="form-header">
            <i class="fas fa-briefcase"></i>
            <h3>עסקה חדשה</h3>
        </div>
        <div class="transaction-type-selector">
            <button type="button" class="type-btn active" data-type="buy">קנייה</button>
            <button type="button" class="type-btn" data-type="sell">מכירה</button>
        </div>
        <div class="form-group"><input type="text" id="stock-symbol" placeholder="סימול המניה" required></div>
        <div class="form-group"><input type="number" id="stock-quantity" placeholder="כמות" required step="any"></div>
        <div class="form-group"><input type="number" id="stock-price" placeholder="מחיר למניה ($)" step="any" required></div>
        <div class="form-group"><input type="date" id="stock-date" required></div>
        <div class="form-group" id="purchase-rate-group"><input type="number" id="stock-rate" placeholder="שער המרה (אופציונלי)" step="any"></div>
        <div class="form-group"><input type="number" id="stock-fees" placeholder="עמלות ($) (אופציונלי)" step="any"></div>
        <button type="submit" class="add-button"><i class="fas fa-check"></i><span id="submit-btn-text">בצע קנייה</span></button>
    `;

    container.appendChild(formElement);

    // --- Add Logic to the Form ---
    const transactionTypeButtons = formElement.querySelectorAll('.type-btn');
    const purchaseRateGroup = formElement.querySelector('#purchase-rate-group');
    const submitBtnText = formElement.querySelector('#submit-btn-text');
    let currentTransactionType = 'buy';

    transactionTypeButtons.forEach(button => { /* ... (This part is unchanged) ... */
        button.addEventListener('click', () => {
            transactionTypeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentTransactionType = button.dataset.type;
            purchaseRateGroup.style.display = currentTransactionType === 'buy' ? 'block' : 'none';
            submitBtnText.textContent = currentTransactionType === 'buy' ? 'בצע קנייה' : 'בצע מכירה';
        });
    });

    formElement.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const symbol = formElement.querySelector('#stock-symbol').value.toUpperCase();
        const quantity = parseFloat(formElement.querySelector('#stock-quantity').value);
        const price = parseFloat(formElement.querySelector('#stock-price').value);
        const date = formElement.querySelector('#stock-date').value;
        const fees = parseFloat(formElement.querySelector('#stock-fees').value) || 0;

        if (currentTransactionType === 'buy') {
            let rate = parseFloat(formElement.querySelector('#stock-rate').value);
            // If user didn't provide a rate, fetch it for them
            if (!rate) {
                rate = await fetchExchangeRate("USD", date);
            }
            
            const totalCostUSD = (price * quantity) + fees;
            const totalCostILS = totalCostUSD * rate;

            const transactionData = {
                symbol, quantity, purchasePrice: price, purchaseDate: date, fees,
                purchaseRateILS: rate,
                totalCostILS: totalCostILS, // <-- NEW FIELD
                timestamp: new Date(),
                status: 'open'
            };
            try {
                await addDoc(investmentsCollection, transactionData);
                alert('הקנייה נרשמה בהצלחה!');
                formElement.reset();
            } catch (error) { console.error("Error saving transaction: ", error); }
        } else {
            // ... (Sell logic remains the same)
        }
    });
}