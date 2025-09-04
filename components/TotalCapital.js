import { db, onSnapshot, collection } from '../services/firebase.js';
import { calculateTotalCapital } from '../services/capitalService.js';

// NOTE: The 'import Chart...' and 'Chart.register(...)' lines have been removed.

export function renderTotalCapital(container, unsubscribes) {
    container.innerHTML = `
        <div class="total-capital-card">
            <div class="chart-container">
                <canvas id="totalCapitalChart"></canvas>
                <div id="chart-center-text" class="chart-text">
                    <div class="chart-label">סך הון כולל</div>
                    <div class="total-value">מחשב...</div>
                    <div class="goal-percentage"></div>
                </div>
            </div>
        </div>
    `;
    const chartCenterText = document.getElementById('chart-center-text');
    const GOAL = 20000000;
    let chartInstance = null;

    async function updateView() {
        const capitalData = await calculateTotalCapital();
        if (!capitalData) return;

        const totalCapital = capitalData.grandTotal;
        const percentage = ((totalCapital / GOAL) * 100).toFixed(1);

        const totalValueEl = chartCenterText.querySelector('.total-value');
        const goalPercentageEl = chartCenterText.querySelector('.goal-percentage');
        const chartEl = document.getElementById('totalCapitalChart');

        if (totalValueEl) totalValueEl.textContent = `₪${totalCapital.toLocaleString('en-US', {maximumFractionDigits: 0})}`;
        if (goalPercentageEl) goalPercentageEl.textContent = `${percentage}% מהיעד`;

        if (chartEl) {
            const ctx = chartEl.getContext('2d');
            const data = { datasets: [{ data: [totalCapital, Math.max(0, GOAL - totalCapital)], backgroundColor: ['#007BFF', '#333'], borderWidth: 0, borderRadius: 20 }] };
            if (chartInstance) {
                chartInstance.data.datasets[0].data = data.datasets[0].data;
                chartInstance.update();
            } else {
                // The 'Chart' object will now be available globally from the script tag in the HTML
                chartInstance = new Chart(ctx, { type: 'doughnut', data: data, options: { cutout: '80%', plugins: { tooltip: { enabled: false }, legend: { display: false } } } });
            }
        }
    }

    unsubscribes.push(onSnapshot(collection(db, 'investments'), updateView));
    unsubscribes.push(onSnapshot(collection(db, 'cashMeasurements'), updateView));
    unsubscribes.push(onSnapshot(collection(db, 'manualAssets'), updateView));
    unsubscribes.push(onSnapshot(collection(db, 'cashboxTransactions'), updateView));
}