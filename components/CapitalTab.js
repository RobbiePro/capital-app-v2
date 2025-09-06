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
            // Toggle category header
            const header = e.target.closest('.category-header');
            if (header) {
                header.classList.toggle('active');
                header.nextElementSibling.classList.toggle('active');
                return;
            }

            // Add new item
            if (e.target.classList.contains('add-item-btn')) {
                e.preventDefault();
                const categoryContent = e.target.closest('.category-content');
                const categoryName = categoryContent.dataset.categoryName;
                
                console.log('Add item clicked for category:', categoryName); // Debug log
                
                // Check if there's already a new item form open
                if (categoryContent.querySelector('.new-item')) {
                    alert('סיים להוסיף את הפריט הנוכחי לפני הוספת פריט חדש');
                    return;
                }
                
                // Create input form for new item
                const newItemHTML = `
                    <div class="asset-item new-item" style="background: #2d2d2d; border: 1px solid #555; border-radius: 12px; padding: 20px; margin: 15px 0;">
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="text" class="new-asset-name" placeholder="שם הנכס החדש" 
                                   style="flex: 2; padding: 12px; border: 1px solid #555; border-radius: 25px; font-size: 14px; box-sizing: border-box; font-family: inherit; background: #333; color: white; height: 44px;" />
                            <input type="number" class="new-asset-value" placeholder="שווי ב-₪" 
                                   style="flex: 1; padding: 12px; border: 1px solid #555; border-radius: 25px; font-size: 14px; box-sizing: border-box; font-family: inherit; background: #333; color: white; height: 44px;" />
                            <button type="button" class="save-new-item-btn" 
                                    style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 500; font-size: 14px; transition: all 0.2s ease; font-family: inherit; height: 44px; white-space: nowrap;">
                                שמור
                            </button>
                        </div>
                    </div>
                `;
                
                // Insert before the add button
                e.target.insertAdjacentHTML('beforebegin', newItemHTML);
                e.target.style.display = 'none'; // Hide add button temporarily
                
                // Focus on name input
                const nameInput = categoryContent.querySelector('.new-asset-name');
                if (nameInput) {
                    nameInput.focus();
                }
                return;
            }

            // Save new item
            if (e.target.classList.contains('save-new-item-btn')) {
                e.preventDefault();
                const newItem = e.target.closest('.new-item');
                const categoryContent = e.target.closest('.category-content');
                const categoryName = categoryContent.dataset.categoryName;
                const addButton = categoryContent.querySelector('.add-item-btn');
                
                // Remember which categories are open
                const openCategories = [];
                document.querySelectorAll('.category-header.active').forEach(header => {
                    const categoryName = header.querySelector('span').textContent;
                    openCategories.push(categoryName);
                });
                
                const nameInput = newItem.querySelector('.new-asset-name');
                const valueInput = newItem.querySelector('.new-asset-value');
                
                const name = nameInput.value.trim();
                const value = parseFloat(valueInput.value) || 0;
                
                if (!name) {
                    alert('אנא הכנס שם לנכס');
                    nameInput.focus();
                    return;
                }
                
                // Generate unique ID for the new asset
                const assetId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                try {
                    // Import required functions
                    const { doc, setDoc } = await import('../services/firebase.js');
                    
                    // Save to Firebase
                    await setDoc(doc(db, "manualAssets", assetId), {
                        name: name,
                        value: value,
                        category: categoryName,
                        isCustom: true
                    });
                    
                    console.log('Asset saved successfully:', { name, value, category: categoryName }); // Debug log
                    
                    // Remove the form and show add button again
                    newItem.remove();
                    addButton.style.display = 'block';
                    
                    // Reload the form to show the new item
                    await loadManualAssetsForm();
                    
                    // Restore open categories
                    openCategories.forEach(catName => {
                        const headers = document.querySelectorAll('.category-header');
                        headers.forEach(header => {
                            if (header.querySelector('span').textContent === catName) {
                                header.classList.add('active');
                                header.nextElementSibling.classList.add('active');
                            }
                        });
                    });
                    
                    alert('הנכס נוסף בהצלחה!');
                    
                } catch (error) {
                    console.error('Error adding new asset:', error);
                    alert('שגיאה בהוספת הנכס. נסה שוב.');
                    
                    // Show add button again even on error
                    newItem.remove();
                    addButton.style.display = 'block';
                }
                return;
            }

            // Delete asset
            if (e.target.classList.contains('delete-asset-btn')) {
                e.preventDefault();
                const assetId = e.target.dataset.assetId;
                const assetItem = e.target.closest('.asset-item');
                const assetName = assetItem.querySelector('label').textContent;
                
                if (confirm(`האם אתה בטוח שברצונך למחוק את "${assetName}"?`)) {
                    try {
                        // Import required functions
                        const { doc, deleteDoc } = await import('../services/firebase.js');
                        await deleteDoc(doc(db, "manualAssets", assetId));
                        
                        // Remove from UI
                        assetItem.remove();
                        alert('הנכס נמחק בהצלחה!');
                        
                    } catch (error) {
                        console.error('Error deleting asset:', error);
                        alert('שגיאה במחיקת הנכס. נסה שוב.');
                    }
                }
                return;
            }
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
