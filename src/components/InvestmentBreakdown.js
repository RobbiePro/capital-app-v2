// components/InvestmentBreakdown.js
import { onSnapshot, collection, db } from '../services/firebase.js';
import { calculateTotalCapital } from '../services/capitalService.js';

export function renderInvestmentBreakdown(container) {
    container.innerHTML = `
        <div class="breakdown-card">
            <h4>פירוט השקעות</h4>
            <div class="breakdown-header">
                <span></span>
                <span>ILS (₪)</span>
                <span>USD ($)</span>
            </div>
            <div id="breakdown-list"><p>טוען...</p></div>
        </div>
    `;

    const listContainer = document.getElementById('breakdown-list');

    async function updateView() {
        const capitalData = await calculateTotalCapital();
        const profitClass = capitalData.totalProfitLossILS >= 0 ? 'profit-positive' : 'profit-negative';
        
        listContainer.innerHTML = `
            <div class="breakdown-item">
                <span class="label">יתרה בקופה</span>
                <span>${capitalData.availableCashInBrokerage.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
                <span>${capitalData.availableCashInBrokerageUSD.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
            </div>
            <div class="breakdown-item">
                <span class="label">כסף מושקע (עלות)</span>
                <span>${capitalData.totalInvestedCostILS.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
                <span>${capitalData.totalInvestedCostUSD.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
            </div>
            <div class="breakdown-item">
                <span class="label">שווי החזקות נוכחי</span>
                <span>${capitalData.holdingsMarketValueILS.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
                <span>${capitalData.holdingsMarketValueUSD.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
            </div>
            <div class="breakdown-item ${profitClass}">
                <span class="label">סה"כ רווח/הפסד</span>
                <span>${capitalData.totalProfitLossILS.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
                <span>${capitalData.totalProfitLossUSD.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
            </div>
            <div class="breakdown-item total">
                <span class="label">שווי התיק הכולל</span>
                <span>${capitalData.investmentsTotal.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
                <span>${capitalData.investmentsTotalUSD.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
            </div>
        `;
    }

    onSnapshot(collection(db, 'investments'), updateView);
    onSnapshot(collection(db, 'cashboxTransactions'), updateView);
}