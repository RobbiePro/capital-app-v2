import { db, doc, getDoc, setDoc, collection, getDocs } from '../services/firebase.js';
import { fetchExchangeRate } from '../services/api.js';

export async function renderGoalsTab(container, unsubscribes) {
    container.innerHTML = `
        <div class="goals-container">
            <div class="tab-header">
                <h2><i class="fas fa-bullseye"></i> יעדים</h2>
            </div>
            <p class="subtitle">צפה ונהל את יעדי ההפקדה והרווח שלך לאורך השנים.</p>
            <div id="goals-table-body">
                <p>טוען יעדים...</p>
            </div>
        </div>
    `;

    const goalsTableBody = document.getElementById('goals-table-body');
    const START_YEAR = 2023;
    const END_YEAR = 2047;
    const DEFAULT_MONTHLY_DEPOSIT = 10000;
    const ANNUAL_RETURN_RATE = 0.10;

    const today = new Date().toISOString().split('T')[0];
    const currentRateUSD_ILS = await fetchExchangeRate("USD", today);

    const customGoals = {};
    const querySnapshot = await getDocs(collection(db, "goals"));
    querySnapshot.forEach(doc => {
        customGoals[doc.id] = doc.data().monthlyDeposit;
    });

    let tableHTML = '';
    let lastYearEndValue = 0;

    for (let year = START_YEAR; year <= END_YEAR; year++) {
        const monthlyDeposit = customGoals[year] !== undefined ? customGoals[year] : DEFAULT_MONTHLY_DEPOSIT;
        
        const annualDeposit = monthlyDeposit * 12;
        const startOfYearValue = lastYearEndValue;
        const endOfYearValueBeforeReturn = startOfYearValue + annualDeposit;
        const annualProfitGoal = endOfYearValueBeforeReturn * ANNUAL_RETURN_RATE;
        const endOfYearTarget = endOfYearValueBeforeReturn + annualProfitGoal;
        lastYearEndValue = endOfYearTarget;

        const endOfYearTargetUSD = currentRateUSD_ILS ? (endOfYearTarget / currentRateUSD_ILS) : 0;

        tableHTML += `
            <div class="goal-year-card" data-start-value="${startOfYearValue}">
                <div class="goal-year-header">${year}</div>
                <div class="goal-details">
                    <div class="detail-item">
                        <label>הפקדה חודשית</label>
                        <span class="editable-goal" data-year="${year}">
                            ₪${monthlyDeposit.toLocaleString()}
                            <i class="fas fa-pencil-alt edit-goal-icon"></i>
                        </span>
                    </div>
                    <div class="detail-item"><label>התחלת שנה</label><span>₪${startOfYearValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div>
                    <div class="detail-item"><label>הפקדה שנתית</label><span>₪${annualDeposit.toLocaleString()}</span></div>
                    <div class="detail-item total-target">
                        <label>יעד סוף שנה</label>
                        <span class="target-value">
                            ₪${endOfYearTarget.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            <small>($${endOfYearTargetUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })})</small>
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    goalsTableBody.innerHTML = tableHTML;

    goalsTableBody.addEventListener('click', async (event) => {
        const editIcon = event.target.closest('.edit-goal-icon');
        if (editIcon) {
            const yearString = editIcon.parentElement.dataset.year;
            const year = parseInt(yearString);
            const card = editIcon.closest('.goal-year-card');
            const startOfYearValue = parseFloat(card.dataset.startValue);

            const currentMonthlyGoal = customGoals[year] !== undefined ? customGoals[year] : DEFAULT_MONTHLY_DEPOSIT;
            const newGoalStr = prompt(`הזן את יעד ההפקדה החודשי החדש לשנת ${year}:`, currentMonthlyGoal);
            
            if (newGoalStr !== null) {
                const newMonthlyGoal = parseFloat(newGoalStr);
                if (!isNaN(newMonthlyGoal) && newMonthlyGoal >= 0) {
                    try {
                        const newAnnualDeposit = newMonthlyGoal * 12;
                        const endValueBeforeReturn = startOfYearValue + newAnnualDeposit;
                        const newAnnualProfitGoal = endValueBeforeReturn * ANNUAL_RETURN_RATE;
                        const newEndOfYearTarget = endValueBeforeReturn + newAnnualProfitGoal;

                        await setDoc(doc(db, "goals", yearString), { 
                            monthlyDeposit: newMonthlyGoal,
                            depositGoal: newAnnualDeposit,
                            profitGoal: newAnnualProfitGoal,
                            endOfYearTarget: newEndOfYearTarget
                        });

                        // Re-render the tab to show changes immediately
                        await renderGoalsTab(container, unsubscribes);
                        
                    } catch (error) {
                        console.error("Error updating goal:", error);
                        alert('שגיאה בעדכון היעד.');
                    }
                } else {
                    alert('נא להזין מספר חוקי.');
                }
            }
        }
    });
}