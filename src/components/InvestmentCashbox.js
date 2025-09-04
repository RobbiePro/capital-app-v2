import { db, collection, addDoc, query, onSnapshot, orderBy } from '../services/firebase.js';

// Collections we need to listen to
const cashboxCollection = collection(db, 'cashboxTransactions');
const investmentsCollection = collection(db, 'investments');

export function renderInvestmentCashbox(container) {
    container.innerHTML = `
        <div class="cashbox-container styled-form">
            <div class="form-header"><i class="fas fa-cash-register"></i><h3>קופת השקעות</h3></div>
            <div class="current-balance"><span>יתרה פנויה:</span><span id="cashbox-balance">מחשב...</span></div>
            <form id="cashbox-form"></form>
            <div class="history-section"><h4>היסטוריית קופה</h4><div id="cashbox-history-list"></div></div>
        </div>
    `;
    const fullFormHTML = `
        <div class="transaction-type-selector">
            <button type="button" class="type-btn active" data-type="deposit">הפקדה</button>
            <button type="button" class="type-btn" data-type="withdrawal">משיכה</button>
        </div>
        <div class="form-group"><input type="date" id="cashbox-date" required></div>
        <div class="form-group"><input type="number" id="cashbox-amount" placeholder="סכום בשקלים" required></div>
        <div class="form-group"><input type="text" id="cashbox-notes" placeholder="הערות (אופציונלי)"></div>
        <button type="submit" class="add-button">בצע</button>
    `;
    const form = document.getElementById('cashbox-form');
    form.innerHTML = fullFormHTML;
    
    const balanceEl = document.getElementById('cashbox-balance');
    const historyListEl = document.getElementById('cashbox-history-list');
    
    let cashboxTransactions = [];
    let investmentTransactions = [];

    // --- RESTRUCTURED LOGIC TO PREVENT RACE CONDITION ---

    // This function ONLY calculates the balance based on the current data
    function updateBalance() {
        let balance = 0;
        cashboxTransactions.forEach(t => {
            balance += (t.type === 'deposit' ? t.amount : -t.amount);
        });
        investmentTransactions.forEach(investment => {
            if (investment.status === 'open') {
                balance -= investment.totalCostILS || 0;
            } else if (investment.status === 'closed') {
                const rate = investment.purchaseRateILS || 3.7;
                const saleProceedsUSD = (investment.sellPrice * investment.quantity) - (investment.capitalGainsTax || 0);
                balance += saleProceedsUSD * rate;
            }
        });
        balanceEl.textContent = `₪${balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        balanceEl.className = balance >= 0 ? 'profit-positive' : 'profit-negative';
    }

    // Listener 1: Watches cashbox. It updates the history AND recalculates the balance.
    onSnapshot(query(cashboxCollection, orderBy('timestamp', 'desc')), (snapshot) => {
        cashboxTransactions = snapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
        
        // This part now ONLY runs when cashbox data changes
        let historyHTML = '';
        cashboxTransactions.forEach(t => {
            const typeClass = t.type === 'deposit' ? 'profit-positive' : 'profit-negative';
            const typeText = t.type === 'deposit' ? 'הפקדה' : 'משיכה';

            // --- THIS IS THE CORRECTED LINE ---
            // We now use the manual 'date' field and reformat it from YYYY-MM-DD to DD.MM.YYYY
            const dateParts = t.date.split('-'); // Splits "2024-03-01" into ["2024", "03", "01"]
            const formattedDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`; // Assembles it into "01.03.2024"

            historyHTML += `<div class="history-item"><span>${formattedDate} - ${typeText}</span><span class="${typeClass}">₪${t.amount.toLocaleString()}</span></div>`;
        });
        historyListEl.innerHTML = historyHTML;
        
        updateBalance(); // Update the balance
    });

    // Listener 2: Watches investments. It ONLY recalculates the balance.
    onSnapshot(query(collection(db, 'investments')), (snapshot) => {
        investmentTransactions = snapshot.docs.map(doc => doc.data());
        updateBalance(); // Update the balance
    });

    // Form submission logic (unchanged)
    const typeButtons = form.querySelectorAll('.type-btn');
    let currentType = 'deposit';
    typeButtons.forEach(button => {
        button.addEventListener('click', () => {
            typeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentType = button.dataset.type;
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const date = document.getElementById('cashbox-date').value;
        const amount = parseFloat(document.getElementById('cashbox-amount').value);
        const notes = document.getElementById('cashbox-notes').value;

        if (!date || isNaN(amount) || amount <= 0) {
            alert('Please fill in all required fields with valid values.');
            return;
        }

        try {
            await addDoc(cashboxCollection, {
                type: currentType,
                date: date,
                amount: amount,
                notes: notes,
                timestamp: new Date()
            });
            form.reset();
            // Set the date back to today after reset
            document.getElementById('cashbox-date').valueAsDate = new Date();
            typeButtons[0].classList.add('active'); // Reset to deposit
            typeButtons[1].classList.remove('active');

        } catch (error) {
            console.error("Error adding cashbox transaction: ", error);
            alert('Failed to add transaction.');
        }
    });
    
    // Set initial date to today
    document.getElementById('cashbox-date').valueAsDate = new Date();
}