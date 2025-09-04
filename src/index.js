// ==========================================
// App Main Controller (The Orchestrator)
// ==========================================
import './style.css';
import { renderCapitalTab } from './components/CapitalTab.js';
import { renderPortfolioTab } from './components/PortfolioTab.js';
import { renderCashTab } from './components/CashTab.js';
import { renderGoalsTab } from './components/GoalsTab.js';
import { renderDashboardTab } from './components/DashboardTab.js';

function initialize_app() {

    const navButtons = document.querySelectorAll('.bottom-nav button');
    // --- THIS IS THE MAIN FIX ---
    // We are now looking for 'root' which exists in our index.html
    const tabContentsContainer = document.getElementById('root');
    
    // Check if the container was found before proceeding
    if (!tabContentsContainer) {
        console.error("Critical Error: The root element with id 'root' was not found in the DOM.");
        return;
    }
    
    const defaultTab = 'dashboard';
    
    let currentTabUnsubscribes = [];

    async function change_tab(tabId) {
        // Update button styles
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Run all cleanup functions for the old tab
        currentTabUnsubscribes.forEach(unsub => unsub());
        currentTabUnsubscribes = []; // Reset the list for the new tab

        // Clear the main content area
        tabContentsContainer.innerHTML = '';

        // Render the new tab and pass it the new, empty cleanup list
        switch (tabId) {
            case 'dashboard':
                await renderDashboardTab(tabContentsContainer, currentTabUnsubscribes);
                break;
            case 'portfolio':
                renderPortfolioTab(tabContentsContainer, currentTabUnsubscribes);
                break;
            case 'cash':
                renderCashTab(tabContentsContainer, currentTabUnsubscribes);
                break;
            case 'capital':
                renderCapitalTab(tabContentsContainer, currentTabUnsubscribes);
                break;
            case 'goals':
                await renderGoalsTab(tabContentsContainer, currentTabUnsubscribes);
                break;
            default:
                tabContentsContainer.innerHTML = `<h1>דף לא נמצא</h1>`;
        }
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            change_tab(tabId);
        });
    });

    change_tab(defaultTab);
}

// --- THIS IS THE SECOND FIX ---
// We call the function directly. The new project setup handles the loading.
initialize_app();