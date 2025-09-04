// components/DepositProgress.js
import { getDashboardGoalsData } from '../services/goalsService.js';

export function renderDepositProgress(container) {
    container.innerHTML = `<div class="deposit-progress-card"><p>טוען התקדמות הפקדות...</p></div>`;

    async function updateView() {
        const allGoalsData = await getDashboardGoalsData();
        const card = container.querySelector('.deposit-progress-card');

        // Check if a goal exists and the specific data is valid
        if (!allGoalsData || !allGoalsData.goalExists || allGoalsData.annualDepositGoal === 0) {
            card.innerHTML = `<h4>התקדמות הפקדות</h4><p>לא הוגדר יעד הפקדות לשנה זו.</p>`;
            return;
        }

        const { annualDepositGoal, linearTargetToday, actualDepositsThisYear, isAhead } = allGoalsData;
        const statusText = isAhead ? "אתה בקצב!" : "צריך להגביר קצב";
        const statusClass = isAhead ? 'ahead' : 'behind';
        const progressPercentage = (actualDepositsThisYear / annualDepositGoal) * 100;

        card.innerHTML = `
            <h4>התקדמות הפקדות</h4>
            <div class="progress-summary">
                <div>
                    <span class="label">הופקד השנה</span>
                    <span class="value">₪${Math.round(actualDepositsThisYear).toLocaleString()}</span>
                </div>
                <div>
                    <span class="label">יעד נדרש להיום</span>
                    <span class="value">₪${Math.round(linearTargetToday).toLocaleString()}</span>
                </div>
                <div class="${statusClass}">
                    <span class="label">סטטוס</span>
                    <span class="value">${statusText}</span>
                </div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progressPercentage}%;"></div>
            </div>
            <div class="progress-bar-label">
                <span>השגת <strong>${Math.round(progressPercentage)}%</strong> מתוך יעד שנתי של ₪${annualDepositGoal.toLocaleString()}</span>
            </div>
        `;
    }

    updateView();
}