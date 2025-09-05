// components/DashboardTab.js
import { renderTotalCapital } from './TotalCapital.js';
import { renderKeyRates } from './KeyRates.js';
import { renderInvestmentBreakdown } from './InvestmentBreakdown.js';
import { renderDepositProgress } from './DepositProgress.js';
import { renderInvestmentGoal } from './InvestmentGoal.js';
import { renderRecords } from './Records.js';
import { PerformanceSnapshot } from './PerformanceSnapshot.js';
import { calculateTotalCapital } from '../services/capitalService.js';
import { updateAndFetchRecords } from '../services/recordsService.js';
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

export async function renderDashboardTab(container, unsubscribes) {
    container.innerHTML = `
        <div class="dashboard-container">
            <div class="tab-header"><h2><i class="fas fa-home"></i> דשבורד ראשי</h2></div>
            <div id="total-capital-component"></div>
            <div id="performance-snapshot-component"><p>טוען תמונת מצב...</p></div>
            <div id="investments-goal-component"></div> 
            <div id="key-rates-component"></div>
            <div id="investment-breakdown-component"></div>
            <div id="deposit-progress-component"></div>
            <div id="records-component"><p>טוען שיאים...</p></div>
        </div>
    `;

    try {
        const capitalData = await calculateTotalCapital();

        if (!capitalData || typeof capitalData.totalProfitLossILS !== 'number') {
            console.error("Critical Error: Could not get a valid profit/loss value from capitalService.", capitalData);
            document.getElementById('performance-snapshot-component').innerHTML = `<p style="color: red;">שגיאה קריטית בחישוב נתונים.</p>`;
            return;
        }

        const recordsData = await updateAndFetchRecords();

        const snapshotContainer = document.getElementById('performance-snapshot-component');
        snapshotContainer.innerHTML = PerformanceSnapshot({
            currentProfit: capitalData.totalProfitLossILS,
            peakProfit: recordsData.peakProfitILS.value,
            previousProfit: recordsData.previousProfitILS 
        });

        renderRecords(document.getElementById('records-component'), recordsData, capitalData);
        renderTotalCapital(document.getElementById('total-capital-component'), unsubscribes);
        renderKeyRates(document.getElementById('key-rates-component'), unsubscribes);
        renderDepositProgress(document.getElementById('deposit-progress-component'));
        renderInvestmentGoal(document.getElementById('investments-goal-component'));
        renderInvestmentBreakdown(document.getElementById('investment-breakdown-component'), unsubscribes);
        
        // הסרתי את הקריאה לפונקציה הבעייתית לעת עתה
        // const functions = getFunctions();
        // const updateProfitFunction = httpsCallable(functions, 'updatePreviousProfit');
        // updateProfitFunction({ currentProfit: capitalData.totalProfitLossILS });

    } catch (error) {
        console.error("Failed to render dashboard:", error);
    }
}