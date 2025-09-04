import { renderTotalCapital } from './TotalCapital.js';
import { renderKeyRates } from './KeyRates.js';
import { renderInvestmentBreakdown } from './InvestmentBreakdown.js';
import { renderDepositProgress } from './DepositProgress.js';
import { renderInvestmentGoal } from './InvestmentGoal.js';
import { renderRecords } from './Records.js';

export async function renderDashboardTab(container, unsubscribes) {
    container.innerHTML = `
        <div class="dashboard-container">
            <div class="tab-header">
                <h2><i class="fas fa-home"></i> דשבורד ראשי</h2>
            </div>
            
            <div id="total-capital-component"></div>
            <div id="investments-goal-component"></div> 
            <div id="key-rates-component"></div>
            <div id="investment-breakdown-component"></div>
            <div id="deposit-progress-component"></div>
            <div id="records-component"></div>
        </div>
    `;

    // The render calls are also reordered for consistency
    renderTotalCapital(document.getElementById('total-capital-component'), unsubscribes);
    renderInvestmentGoal(document.getElementById('investments-goal-component'));
    renderKeyRates(document.getElementById('key-rates-component'), unsubscribes);
    renderInvestmentBreakdown(document.getElementById('investment-breakdown-component'), unsubscribes);
    renderDepositProgress(document.getElementById('deposit-progress-component'));
    renderRecords(document.getElementById('records-component'));
}