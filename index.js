// ==========================================
// App Main Controller (The Orchestrator)
// ==========================================

import { renderCapitalTab } from './components/CapitalTab.js';
import { renderPortfolioTab } from './components/PortfolioTab.js';
import { renderCashTab } from './components/CashTab.js';
import { renderGoalsTab } from './components/GoalsTab.js';
import { renderDashboardTab } from './components/DashboardTab.js';

function initialize_app() {
    const navButtons = document.querySelectorAll('.bottom-nav button');
    const tabContentsContainer = document.getElementById('app-content');
    
    if (!tabContentsContainer) {
        console.error("Critical Error: The root element with id 'app-content' was not found in the DOM.");
        return;
    }
    
    const defaultTab = 'dashboard';
    
    let currentTabUnsubscribes = [];

    async function change_tab(tabId) {
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        currentTabUnsubscribes.forEach(unsub => unsub());
        currentTabUnsubscribes = [];

        tabContentsContainer.innerHTML = '';

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

initialize_app();