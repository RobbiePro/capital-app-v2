// --- Start of the Complete and Corrected TransactionList.js file ---

import { db, collection, query, where, getDocs, orderBy, doc, deleteDoc } from '../services/firebase.js';

export async function renderTransactionList(container, symbol) {
    container.innerHTML = `<p>טוען עסקאות...</p>`;

    // We order by the manual date field now to show them in chronological order
    const q = query(collection(db, "investments"), where("symbol", "==", symbol), orderBy("purchaseDate", "desc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        container.innerHTML = '<p>לא נמצאו עסקאות עבור סימול זה.</p>';
        return;
    }

    let transactionsHTML = querySnapshot.docs.map(doc => {
        const trans = doc.data();
        
        let dateStr = trans.purchaseDate; // Default to purchase date
        if (trans.status === 'closed' && trans.sellDate) {
            dateStr = trans.sellDate; // Use sellDate for closed transactions
        }
        const dateParts = dateStr.split('-');
        const formattedDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;

        const deleteButton = `<i class="fas fa-trash-alt delete-transaction-btn" data-doc-id="${doc.id}"></i>`;

        if (trans.status === 'closed') {
            const profit = (trans.sellPrice - trans.purchasePrice) * trans.quantity - (trans.capitalGainsTax || 0);
            const profitClass = profit >= 0 ? 'profit-positive' : 'profit-negative';
            return `
                <div class="transaction-item sell">
                    <div class="transaction-info">
                        <div class="transaction-header"><strong>מכירה</strong> - ${formattedDate}</div>
                        <div>כמות: ${trans.quantity} | מחיר מכירה: $${trans.sellPrice.toFixed(2)}</div>
                        <div class="profit ${profitClass}">רווח/הפסד נטו: $${profit.toFixed(2)}</div>
                    </div>
                    ${deleteButton}
                </div>`;
        } else { // This is a BUY transaction
            const rateDisplay = trans.purchaseRateILS ? ` | שער: ₪${trans.purchaseRateILS.toFixed(3)}` : '';
            return `
                <div class="transaction-item buy">
                    <div class="transaction-info">
                        <div class="transaction-header"><strong>קנייה</strong> - ${formattedDate}</div>
                        <div>כמות: ${trans.quantity} | מחיר קנייה: $${trans.purchasePrice.toFixed(2)}${rateDisplay}</div>
                    </div>
                    ${deleteButton}
                </div>`;
        }
    }).join('');

    container.innerHTML = `<div class="transaction-list">${transactionsHTML}</div>`;
    
    // Inject styles for the modal if they don't exist
    if (!document.getElementById('custom-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'custom-modal-styles';
        style.innerHTML = `
            .custom-modal-backdrop {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0, 0, 0, 0.6);
                display: flex; justify-content: center; align-items: center;
                z-index: 1000;
            }
            .custom-modal-content {
                background-color: #2c2c2c; color: white; padding: 25px;
                border-radius: 8px; text-align: center;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
            }
            .custom-modal-content p {
                margin: 0 0 20px; font-size: 1.1em;
            }
            .custom-modal-buttons button {
                padding: 10px 20px; border: none; border-radius: 5px;
                cursor: pointer; font-size: 1em; margin: 0 10px;
            }
            .modal-btn-confirm { background-color: #d9534f; color: white; }
            .modal-btn-cancel { background-color: #5cb85c; color: white; }
        `;
        document.head.appendChild(style);
    }

    /**
     * Shows a custom confirmation modal.
     * @param {string} message The message to display to the user.
     * @param {Function} onConfirm The callback function to execute if the user confirms.
     */
    function showConfirmationModal(message, onConfirm) {
        // Create modal elements
        const backdrop = document.createElement('div');
        backdrop.className = 'custom-modal-backdrop';

        const modalContent = document.createElement('div');
        modalContent.className = 'custom-modal-content';

        const text = document.createElement('p');
        text.textContent = message;

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'custom-modal-buttons';

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'כן, מחק';
        confirmBtn.className = 'modal-btn-confirm';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'ביטול';
        cancelBtn.className = 'modal-btn-cancel';

        // Append elements
        buttonContainer.append(confirmBtn, cancelBtn);
        modalContent.append(text, buttonContainer);
        backdrop.appendChild(modalContent);
        document.body.appendChild(backdrop);

        // Event handlers
        confirmBtn.onclick = () => {
            onConfirm();
            document.body.removeChild(backdrop);
        };

        cancelBtn.onclick = () => {
            document.body.removeChild(backdrop);
        };
    }

    // Add event listener for delete buttons
    container.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-transaction-btn')) {
            const docId = event.target.dataset.docId;
            
            showConfirmationModal('האם אתה בטוח שברצונך למחוק עסקה זו?', async () => {
                try {
                    await deleteDoc(doc(db, 'investments', docId));
                    // After deleting, we re-render the list to show the change
                    renderTransactionList(container, symbol);
                } catch (error) {
                    console.error("Error deleting transaction: ", error);
                    alert('שגיאה במחיקת העסקה.');
                }
            });
        }
    });
}
// --- End of the Complete and Corrected TransactionList.js file ---