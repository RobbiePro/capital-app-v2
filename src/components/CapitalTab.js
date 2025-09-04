import { db, doc, collection, getDocs, writeBatch, deleteDoc, onSnapshot, query, orderBy, addDoc, manualAssetsCollection, capitalSnapshotsCollection } from '../services/firebase.js';
import { renderCapitalBreakdown } from './CapitalBreakdown.js';

export function renderCapitalTab(container, unsubscribes) {
    container.innerHTML = `
        <div class="capital-container">
            <div class="tab-header">
                <h2><i class="fas fa-university"></i> הון (עדכון ידני)</h2>
            </div>
            <p class="subtitle">עדכן כאן את שווי הנכסים הידניים שלך ולחץ שמור.</p>
            <form id="manual-assets-form">
                <div id="asset-categories-container"><p>טוען טופס...</p></div>
                <button type="submit" class="add-button">שמור מדידה וצור תמונת מצב</button>
            </form>
            <div id="capital-breakdown-component-container" class="history-section"></div>
            <div id="capital-history-container" class="history-section">
                <h3>היסטוריית הון</h3>
                <div id="capital-history-list"></div>
            </div>
        </div>
    `;

    const form = document.getElementById('manual-assets-form');
    const categoriesContainer = document.getElementById('asset-categories-container');
    const breakdownContainer = document.getElementById('capital-breakdown-component-container');
    const historyList = document.getElementById('capital-history-list');

    renderCapitalBreakdown(breakdownContainer, unsubscribes);
    
    async function loadManualAssetsForm() {
        const defaultCategories = {
            "ביטוחים ופנסיה": { pension_1: "פוליסת השקעה", pension_2: "הפניקס פנסיה מקיפה", pension_3: "קרן השתלמות" },
            "בנקים ואפליקציות": { bank_1: "דיסקונט", bank_2: "מזרחי", bank_3: "ביט", bank_4: "פייבוקס", bank_5: "גרואו סליקה" },
            "חייבים לי": { debt_1: "בעלת הדירה", debt_2: "דבורי", debt_3: "בקטע אחר" }
        };
        const savedAssets = {};
        const querySnapshot = await getDocs(manualAssetsCollection);
        querySnapshot.forEach(doc => { savedAssets[doc.id] = doc.data(); });
        categoriesContainer.innerHTML = '';
        let allItems = {};
        for (const categoryName in defaultCategories) { allItems[categoryName] = { ...defaultCategories[categoryName] }; }
        for (const assetId in savedAssets) {
            const asset = savedAssets[assetId];
            if (asset.isCustom) {
                if (!allItems[asset.category]) { allItems[asset.category] = {}; }
                allItems[asset.category][assetId] = asset.name;
            }
        }
        for (const categoryName in allItems) {
            const items = allItems[categoryName];
            let itemsHTML = '';
            for (const assetId in items) {
                const assetName = items[assetId];
                const savedValue = savedAssets[assetId] ? savedAssets[assetId].value : '';
                itemsHTML += `<div class="asset-item" data-id="${assetId}"><label>${assetName}</label><div class="input-group"><input type="number" data-asset-id="${assetId}" class="asset-value" placeholder="שווי ב-₪" value="${savedValue}"><i class="fas fa-trash-alt delete-asset-btn" data-asset-id="${assetId}"></i></div></div>`;
            }
            categoriesContainer.innerHTML += `<div class="asset-category"><button type="button" class="category-header"><span>${categoryName}</span><i class="fas fa-chevron-down"></i></button><div class="category-content" data-category-name="${categoryName}">${itemsHTML}<button type="button" class="add-button add-item-btn add-button-small">+ הוסף פריט</button></div></div>`;
        }
        addFormEventListeners();
    }

    function addFormEventListeners() {
        categoriesContainer.addEventListener('click', async (e) => {
            const header = e.target.closest('.category-header');
            if (header) {
                header.classList.toggle('active');
                header.nextElementSibling.classList.toggle('active');
                return;
            }
            if (e.target.classList.contains('add-item-btn')) { /* ... */ }
            if (e.target.classList.contains('delete-asset-btn')) { /* ... */ }
            if (e.target.classList.contains('cancel-add-btn')) { /* ... */ }
        });
    }

    loadManualAssetsForm();
    
    function renderHistory(snapshot) {
        if (snapshot.empty) {
            historyList.innerHTML = '<p>אין היסטוריה להצגה.</p>';
            return;
        }
        historyList.innerHTML = snapshot.docs.map(doc => {
            const data = doc.data();
            const date = new Date(data.timestamp.toDate()).toLocaleDateString('he-IL');
            return `<div class="history-item"><span>${date}</span><span>₪${data.totalCapital.toLocaleString('en-US', {maximumFractionDigits: 0})}</span></div>`;
        }).join('');
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const batch = writeBatch(db);
        document.querySelectorAll('.asset-value:not(.new-asset-value)').forEach(input => {
            const assetId = input.dataset.assetId;
            const value = parseFloat(input.value) || 0;
            const labelEl = input.closest('.asset-item').querySelector('label');
            if (labelEl) {
                const name = labelEl.textContent;
                const category = input.closest('.category-content').dataset.categoryName;
                batch.set(doc(db, "manualAssets", assetId), { name, value, category }, { merge: true });
            }
        });
        await batch.commit();

        const { calculateTotalCapital } = await import('../services/capitalService.js');
        const currentPicture = await calculateTotalCapital();
        await addDoc(capitalSnapshotsCollection, {
            totalCapital: currentPicture.grandTotal,
            timestamp: new Date()
        });
        
        alert('המדידה נשמרה ותמונת מצב היסטורית נוצרה!');
        loadManualAssetsForm();
        renderCapitalBreakdown(breakdownContainer, unsubscribes);
    });

    const unsubSnapshots = onSnapshot(query(capitalSnapshotsCollection, orderBy('timestamp', 'desc')), (snapshot) => renderHistory(snapshot));
    unsubscribes.push(unsubSnapshots);
}