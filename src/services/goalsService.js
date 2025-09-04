// services/goalsService.js
import { db, collection, getDoc, doc, query, where, getDocs } from './firebase.js';
import { calculateTotalCapital } from './capitalService.js';
import { fetchExchangeRate } from './api.js'; // <-- Added for currency conversion

export async function getDashboardGoalsData() {
    const today = new Date();
    const currentYear = today.getFullYear();

    try {
        // --- 1. Fetch the Core Goal Document & Other Data ---
        const [goalDoc, capitalData, currentRateUSD_ILS] = await Promise.all([
            getDoc(doc(db, 'goals', String(currentYear))),
            calculateTotalCapital(),
            fetchExchangeRate("USD", today.toISOString().split('T')[0])
        ]);

        if (!goalDoc.exists()) {
            console.warn(`No goal document found for year ${currentYear}.`);
            return { goalExists: false };
        }
        const goalData = goalDoc.data();

        // --- 2. Calculate Deposit Progress ---
        const startOfYear = new Date(currentYear, 0, 1);
        const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
        const annualDepositGoal = goalData.depositGoal || 0;
        const linearTargetToday = (annualDepositGoal / 365) * dayOfYear;
        
        const q = query(
            collection(db, 'cashboxTransactions'),
            where('type', '==', 'deposit'),
            where('date', '>=', `${currentYear}-01-01`) 
        );
        const querySnapshot = await getDocs(q);
        let actualDepositsThisYear = 0;
        querySnapshot.forEach(doc => {
            if(doc.data().date.startsWith(String(currentYear))) {
                actualDepositsThisYear += doc.data().amount;
            }
        });

        // --- 3. Assemble and Return All Data (including new USD values) ---
        return {
            goalExists: true,
            annualDepositGoal: annualDepositGoal,
            linearTargetToday: linearTargetToday,
            actualDepositsThisYear: actualDepositsThisYear,
            isAhead: actualDepositsThisYear >= linearTargetToday,
            yearEndTarget: goalData.endOfYearTarget || 0,
            currentInvestmentsValue: capitalData.investmentsTotal,
            // --- NEW VALUES ADDED ---
            yearEndTargetUSD: (goalData.endOfYearTarget && currentRateUSD_ILS) ? goalData.endOfYearTarget / currentRateUSD_ILS : 0,
            currentInvestmentsValueUSD: capitalData.investmentsTotalUSD
        };

    } catch (error)
    {
        console.error("Error fetching dashboard goals data:", error);
        return { goalExists: false, error: true };
    }
}