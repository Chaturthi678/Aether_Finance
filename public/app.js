// App State
let transactions = [];
let categoryChartInstance = null;

// Budget Limits definition
const BUDGET_LIMITS = {
  "Food & Dining": 5000,
  "Shopping": 10000,
  "Bills & Utilities": 8000,
  "Transport": 3000,
  "Entertainment": 4000,
  "Others": 5000
};

// Formatter Helpers
const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2
});

function formatDate(isoString) {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return isoString;
  }
}

// DOM Elements
const totalBalanceVal = document.getElementById('total-balance-val');
const totalInflowVal = document.getElementById('total-inflow-val');
const totalOutflowVal = document.getElementById('total-outflow-val');
const transactionList = document.getElementById('transaction-list');
const syncBankBtn = document.getElementById('sync-bank-btn');
const clearDbBtn = document.getElementById('clear-db-btn');
const searchTxnInput = document.getElementById('search-txn-input');
const filterTypeSelect = document.getElementById('filter-type-select');
const syncStatusBadge = document.getElementById('sync-status-badge');
const syncLoader = document.getElementById('sync-loader');
const budgetProgressList = document.getElementById('budget-progress-list');

// Load Data on Start
window.addEventListener('DOMContentLoaded', () => {
  fetchTransactions();
});

// Fetch transactions from the database
async function fetchTransactions() {
  try {
    const response = await fetch('/api/transactions');
    const data = await response.json();
    transactions = data.transactions || [];
    renderDashboard();
  } catch (error) {
    console.error('Error fetching transactions:', error);
    alert('Failed to load transaction data.');
  }
}

// Calculate Stats and Render Dashboard components
function renderDashboard() {
  let totalInflow = 0;
  let totalOutflow = 0;
  
  // Aggregate expenses by category
  const categoryExpenses = {
    "Food & Dining": 0,
    "Shopping": 0,
    "Bills & Utilities": 0,
    "Transport": 0,
    "Entertainment": 0,
    "Others": 0
  };

  transactions.forEach(tx => {
    const amount = parseFloat(tx.amount) || 0;
    if (tx.type.toUpperCase() === 'CREDIT') {
      totalInflow += amount;
    } else {
      totalOutflow += amount;
      
      // Categorize and aggregate
      const cat = tx.category || 'Others';
      if (categoryExpenses.hasOwnProperty(cat)) {
        categoryExpenses[cat] += amount;
      } else {
        categoryExpenses["Others"] += amount;
      }
    }
  });

  const netBalance = totalInflow - totalOutflow;

  // Update Stats UI
  totalBalanceVal.innerText = rupeeFormatter.format(netBalance);
  totalInflowVal.innerText = rupeeFormatter.format(totalInflow);
  totalOutflowVal.innerText = rupeeFormatter.format(totalOutflow);

  // Update Connection Status Badge
  if (transactions.length > 0) {
    syncStatusBadge.innerText = 'Bank Sync Connected';
    syncStatusBadge.className = 'badge badge-connected';
  } else {
    syncStatusBadge.innerText = 'Bank Sync Offline';
    syncStatusBadge.className = 'badge badge-disconnected';
  }

  // Render Category Doughnut Chart
  renderCategoryChart(categoryExpenses);

  // Render Budgets Progress
  renderBudgets(categoryExpenses);

  // Render Filtered Table
  renderTableRows();
}

// Render Doughnut Chart using Chart.js
function renderCategoryChart(categoryExpenses) {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  
  // Get active categories that have spending
  const labels = [];
  const data = [];
  
  for (const [cat, val] of Object.entries(categoryExpenses)) {
    if (val > 0) {
      labels.push(cat);
      data.push(val);
    }
  }

  // Destroy previous instance
  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  if (labels.length === 0) {
    // Empty dataset visual state
    categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['No Expenses'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(255, 255, 255, 0.05)'],
          borderColor: ['rgba(255, 255, 255, 0.1)'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        cutout: '75%'
      }
    });
    return;
  }

  // Theme palettes matching standard dashboard UI variables
  const backgroundColors = [
    'rgba(244, 63, 94, 0.75)',   // Food & Dining (Rose)
    'rgba(99, 102, 241, 0.75)',  // Shopping (Indigo)
    'rgba(234, 179, 8, 0.75)',   // Bills & Utilities (Amber)
    'rgba(59, 130, 246, 0.75)',  // Transport (Blue)
    'rgba(168, 85, 247, 0.75)',  // Entertainment (Purple)
    'rgba(148, 163, 184, 0.75)'  // Others (Slate)
  ];
  
  const borderColors = [
    'rgba(244, 63, 94, 1)',
    'rgba(99, 102, 241, 1)',
    'rgba(234, 179, 8, 1)',
    'rgba(59, 130, 246, 1)',
    'rgba(168, 85, 247, 1)',
    'rgba(148, 163, 184, 1)'
  ];

  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderColor: borderColors.slice(0, labels.length),
        borderWidth: 1.5,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 11, weight: '500' },
            boxWidth: 12,
            padding: 12
          }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#fff',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              return ` Spent: ₹${context.raw.toLocaleString('en-IN')}`;
            }
          }
        }
      },
      cutout: '70%'
    }
  });
}

// Render Monthly Budget utilization bars
function renderBudgets(categoryExpenses) {
  const totalSpend = Object.values(categoryExpenses).reduce((a, b) => a + b, 0);
  
  if (totalSpend === 0) {
    budgetProgressList.innerHTML = '<div class="empty-budget">Sync bank data to view budget utilization.</div>';
    return;
  }

  let html = '';
  for (const [category, limit] of Object.entries(BUDGET_LIMITS)) {
    const spent = categoryExpenses[category] || 0;
    const pct = Math.min((spent / limit) * 100, 100);
    const displayPct = ((spent / limit) * 100).toFixed(0);

    // Color gradient coding based on usage ratio
    let barGradient = 'linear-gradient(90deg, #818cf8, #6366f1)'; // Indigo default
    if (spent > limit) {
      barGradient = 'linear-gradient(90deg, #f87171, #ef4444)'; // Red overflow
    } else if (pct >= 80) {
      barGradient = 'linear-gradient(90deg, #fbbf24, #f59e0b)'; // Amber warning
    } else {
      barGradient = 'linear-gradient(90deg, #60a5fa, #3b82f6)'; // Blue comfort
    }

    html += `
      <div class="budget-item">
        <div class="budget-info-row">
          <span class="budget-category-name">${category}</span>
          <span class="budget-values">₹${Math.round(spent).toLocaleString('en-IN')} <span style="color:#64748b;font-size:0.75rem;">/ ₹${limit.toLocaleString('en-IN')}</span> (${displayPct}%)</span>
        </div>
        <div class="budget-progress-bg">
          <div class="budget-progress-fill" style="width: ${pct}%; background: ${barGradient};"></div>
        </div>
      </div>
    `;
  }
  budgetProgressList.innerHTML = html;
}

// Render Table Rows based on Search and Filter criteria
function renderTableRows() {
  const searchTerm = searchTxnInput.value.toLowerCase().trim();
  const filterType = filterTypeSelect.value;

  const filtered = transactions.filter(tx => {
    const narrationMatches = (tx.narration || '').toLowerCase().includes(searchTerm);
    const typeMatches = filterType === 'ALL' || tx.type.toUpperCase() === filterType;
    return narrationMatches && typeMatches;
  });

  if (filtered.length === 0) {
    transactionList.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">
          <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
            <p>${transactions.length === 0 ? 'No transactions found. Click "Sync Real Bank via Setu" to import mock transactions.' : 'No transactions match your search filters.'}</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  transactionList.innerHTML = filtered.map(tx => {
    const isCredit = tx.type.toUpperCase() === 'CREDIT';
    const amountClass = isCredit ? 'txn-amount-credit' : 'txn-amount-debit';
    const badgeClass = isCredit ? 'txn-badge txn-badge-credit' : 'txn-badge txn-badge-debit';
    const sign = isCredit ? '+' : '-';
    
    return `
      <tr class="transaction-row fade-in">
        <td>${formatDate(tx.date)}</td>
        <td>
          <div class="txn-narration" title="${tx.narration}">${tx.narration}</div>
        </td>
        <td>
          <span class="txn-category-badge">${tx.category || 'Others'}</span>
        </td>
        <td>
          <span class="${badgeClass}">${tx.type}</span>
        </td>
        <td class="${amountClass}">${sign} ${rupeeFormatter.format(tx.amount).replace('₹', '')}</td>
      </tr>
    `;
  }).join('');
}

// Trigger Local Mock Sync Flow
syncBankBtn.addEventListener('click', async () => {
  try {
    // Show full sync loader screen
    syncLoader.classList.remove('hidden');
    syncBankBtn.disabled = true;

    const response = await fetch('/api/sync-bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    
    // Simulate slight syncing delay for premium loader experience
    setTimeout(() => {
      syncLoader.classList.add('hidden');
      syncBankBtn.disabled = false;

      if (result.success) {
        transactions = result.transactions || [];
        renderDashboard();
        alert('Successfully synced transactions via local Setu simulation!');
      } else {
        throw new Error(result.error || 'Mock sync endpoint failed.');
      }
    }, 1500);

  } catch (error) {
    console.error('Local sync failed:', error);
    syncLoader.classList.add('hidden');
    syncBankBtn.disabled = false;
    alert('Failed to connect to local Setu mock server.');
  }
});

// Clear Database
clearDbBtn.addEventListener('click', async () => {
  if (confirm('Are you sure you want to clear your local database? This will delete all synced transactions.')) {
    try {
      const response = await fetch('/api/transactions', { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        transactions = [];
        renderDashboard();
        alert('Database cleared successfully.');
      }
    } catch (error) {
      console.error('Failed to clear database:', error);
      alert('Failed to clear database.');
    }
  }
});

// Setup filters events
searchTxnInput.addEventListener('input', renderTableRows);
filterTypeSelect.addEventListener('change', renderTableRows);
