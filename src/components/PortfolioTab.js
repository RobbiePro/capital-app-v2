import { renderAddTransactionForm } from './AddTransactionForm.js';
import { renderHoldingsList } from './HoldingsList.js';
import { renderInvestmentCashbox } from './InvestmentCashbox.js';

export function renderPortfolioTab(container, unsubscribes) {
    container.innerHTML = `
        <div class="portfolio-container">
            <div class="tab-header">
                <h2><i class="fas fa-chart-line"></i> תיק ההשקעות</h2>
            </div>
            <div id="add-transaction-form-container"></div>
            <div id="portfolio-list-container"></div>
            <div id="investment-cashbox-container"></div>
        </div>
    `;

    const formContainer = document.getElementById('add-transaction-form-container');
    const listContainer = document.getElementById('portfolio-list-container');
    const cashboxContainer = document.getElementById('investment-cashbox-container');

    renderAddTransactionForm(formContainer);
    renderHoldingsList(listContainer, unsubscribes);
    renderInvestmentCashbox(cashboxContainer, unsubscribes);
}