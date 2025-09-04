// components/CapitalBreakdown.js
import { calculateTotalCapital } from '../services/capitalService.js';

export function renderCapitalBreakdown(container) {
    container.innerHTML = `
        <div class="capital-breakdown-container">
            <h4>פירוט ההון</h4>
            <div id="capital-breakdown-list"><p>טוען נתונים...</p></div>
        </div>
    `;

    const listContainer = document.getElementById('capital-breakdown-list');

    async function updateView() {
        try {
            const capitalData = await calculateTotalCapital();

            // Create the detailed list for manual assets, now with categories
            let manualAssetsHTML = '';
            const categoriesOrder = ["ביטוחים ופנסיה", "בנקים ואפליקציות", "חייבים לי"]; // Define desired order
            
            for (const categoryName of categoriesOrder) {
                const category = capitalData.manualAssetsGrouped[categoryName];
                if (category) {
                    manualAssetsHTML += `
                        <div class="manual-asset-category-header">
                            <span>${categoryName}</span>
                            <span>₪${Math.round(category.total).toLocaleString()}</span>
                        </div>
                    `;
                    manualAssetsHTML += category.items.map(asset => `
                        <div class="manual-asset-detail">
                            <span>${asset.name}</span>
                            <span>₪${Math.round(asset.value).toLocaleString()}</span>
                        </div>
                    `).join('');
                }
            }

            listContainer.innerHTML = `
                <div class="capital-item-wrapper">
                    <div class="capital-item">
                        <span><i class="fas fa-edit"></i> הון ידני</span>
                        <span>₪${Math.round(capitalData.manualAssetsTotal).toLocaleString()}</span>
                    </div>
                    <div class="capital-item-details">
                        ${manualAssetsHTML}
                    </div>
                </div>
                <div class="capital-item">
                    <span><i class="fas fa-wallet"></i> מזומן</span>
                    <span>₪${Math.round(capitalData.cashTotal).toLocaleString()}</span>
                </div>
                <div class="capital-item">
                    <span><i class="fas fa-chart-line"></i> סך הכל השקעות</span>
                    <span>₪${Math.round(capitalData.investmentsTotal).toLocaleString()}</span>
                </div>
                <div class="capital-item total">
                    <span><strong>סה"כ הון</strong></span>
                    <span><strong>₪${Math.round(capitalData.grandTotal).toLocaleString()}</strong></span>
                </div>
            `;

        } catch (error) {
            console.error("Error updating capital breakdown view:", error);
            listContainer.innerHTML = `<p>שגיאה בטעינת הנתונים.</p>`;
        }
    }

    updateView(); // Call it once on initial render
}