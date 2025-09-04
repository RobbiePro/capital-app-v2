// components/InvestmentGoal.js
import { getDashboardGoalsData } from '../services/goalsService.js';

export function renderInvestmentGoal(container) {
    container.id = 'investment-total-vs-goal-component';
    container.innerHTML = `<div class="investment-goal-card"><p>טוען התקדמות יעד שנתי...</p></div>`;

    async function updateView() {
        const allGoalsData = await getDashboardGoalsData();
        const card = container.querySelector('.investment-goal-card');

        if (!allGoalsData || !allGoalsData.goalExists || allGoalsData.yearEndTarget === 0) {
            card.innerHTML = `<h4>שווי תיק מול יעד</h4><p>לא הוגדר יעד סוף שנה.</p>`;
            return;
        }

        const { yearEndTarget, currentInvestmentsValue, yearEndTargetUSD, currentInvestmentsValueUSD } = allGoalsData;
        
        const positiveValue = Math.max(0, currentInvestmentsValue);
        const progressPercentage = (positiveValue / yearEndTarget) * 100;
        
        card.innerHTML = `
            <h4>שווי תיק מול יעד</h4>
            <div class="goal-summary">
                <div>
                    <span class="label">שווי נוכחי</span>
                    <span class="value">
                        ₪${Math.round(currentInvestmentsValue).toLocaleString()}
                        <small>($${Math.round(currentInvestmentsValueUSD).toLocaleString()})</small>
                    </span>
                </div>
                <div>
                    <span class="label">יעד סוף שנה</span>
                    <span class="value">
                        ₪${Math.round(yearEndTarget).toLocaleString()}
                        <small>($${Math.round(yearEndTargetUSD).toLocaleString()})</small>
                    </span>
                </div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progressPercentage}%;"></div>
            </div>
            <div class="progress-bar-label">
                <span>השגת <strong>${Math.round(progressPercentage)}%</strong> מהיעד</span>
            </div>
        `;
    }

    updateView();
}