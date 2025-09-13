// Core Data & Utils
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let loans = JSON.parse(localStorage.getItem('loans')) || [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || [];
let monthlyIncome = localStorage.getItem('monthlyIncome') || null;

const categories = ['Food', 'Rent', 'Entertainment', 'Transport', 'EMI/Loan', 'Others'];

const alertsList = document.getElementById('alerts-list');
const alertSection = document.getElementById('alerts-section');

const expenseSection = document.getElementById('expense-entry');
const loanSection = document.getElementById('loan-section');
const budgetGoalsSection = document.getElementById('budget-goals-section');
const dashboardSection = document.getElementById('dashboard-section');

const incomeSection = document.getElementById('income-section');

const themeToggleBtn = document.getElementById('theme-toggle');

const monthlyIncomeInput = document.getElementById('monthly-income');
const saveIncomeBtn = document.getElementById('save-income-btn');

const expenseForm = document.getElementById('expense-form');
const loanForm = document.getElementById('loan-form');
const budgetGoalForm = document.getElementById('budget-goal-form');

const expenseChartCtx = document.getElementById('expense-chart').getContext('2d');
const goalListEl = document.getElementById('goal-list');

const monthSelect = document.getElementById('month-select');
const expenseTableBody = document.getElementById('expense-table-body');

let expenseChart = null;

// ---------- THEMES ----------
function setTheme(dark = true) {
  if (dark) {
    document.body.classList.remove('light-theme');
    themeToggleBtn.textContent = 'Switch to Light Theme';
  } else {
    document.body.classList.add('light-theme');
    themeToggleBtn.textContent = 'Switch to Dark Theme';
  }
}
themeToggleBtn.addEventListener('click', () => {
  const isDark = !document.body.classList.contains('light-theme');
  setTheme(!isDark);
});
setTheme(true);

// ---------- INCOME ----------
function showAppSections() {
  incomeSection.classList.add('hidden');
  expenseSection.classList.remove('hidden');
  loanSection.classList.remove('hidden');
  budgetGoalsSection.classList.remove('hidden');
  dashboardSection.classList.remove('hidden');
  alertSection.classList.remove('hidden');
  monthSelect.value = getCurrentMonth();
}

function getCurrentMonth() {
  const now = new Date();
  return now.toISOString().slice(0, 7);
}

if (monthlyIncome) {
  monthlyIncomeInput.value = monthlyIncome;
  showAppSections();
}

saveIncomeBtn.addEventListener('click', () => {
  const val = parseFloat(monthlyIncomeInput.value);
  if (val > 0) {
    monthlyIncome = val;
    localStorage.setItem('monthlyIncome', val);
    addAlert(`Yo! Your monthly income is set to ₹${val.toFixed(2)} 💰`);
    showAppSections();
    updateDashboard();
  } else {
    alert('Please enter a valid monthly income');
  }
});

// ---------- ALERTS ----------
function addAlert(msg) {
  const li = document.createElement('li');
  li.textContent = msg;
  alertsList.prepend(li);
  alertSection.classList.remove('hidden');
}

// ---------- EXPENSES ----------
function categorizeExpense(desc) {
  // Simple keyword based categorization
  const descLower = desc.toLowerCase();
  if (descLower.match(/rent|house|apartment/)) return 'Rent';
  if (descLower.match(/food|restaurant|cafe|dinner|lunch|breakfast|mcdo|pizza|burger|hotel/)) return 'Food';
  if (descLower.match(/movie|netflix|spotify|entertainment|game|gaming|concert/)) return 'Entertainment';
  if (descLower.match(/uber|ola|taxi|bus|train|metro|transport|fuel|petrol|diesel/)) return 'Transport';
  // If description matches any loan or EMI, assign EMI/Loan
  if (loans.some(loan => descLower.includes(loan.name.toLowerCase()))) return 'EMI/Loan';
  return 'Others';
}

expenseForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const date = e.target['expense-date'].value;
  const amount = parseFloat(e.target['expense-amount'].value);
  const desc = e.target['expense-desc'].value.trim();

  if (!date || !amount || !desc) {
    alert('Fill all expense fields properly');
    return;
  }

  const category = categorizeExpense(desc);

  const newExpense = { date, amount, description: desc, category };
  expenses.push(newExpense);
  localStorage.setItem('expenses', JSON.stringify(expenses));

  addAlert(`Added ₹${amount.toFixed(2)} to ${category} on ${date} 🤑`);

  e.target.reset();
  updateDashboard();
  checkBudgetAlerts();
});

// ---------- LOANS ----------
loanForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = e.target['loan-name'].value.trim();
  const amount = parseFloat(e.target['loan-amount'].value);
  if (!name || !amount) {
    alert('Fill loan fields properly');
    return;
  }
  loans.push({ name, amount });
  localStorage.setItem('loans', JSON.stringify(loans));
  addAlert(`Added loan/EMI: ${name} ₹${amount.toFixed(2)} 🏦`);
  e.target.reset();
  updateDashboard();
  checkBudgetAlerts();
});

// ---------- BUDGET & GOALS ----------
budgetGoalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const category = e.target['goal-category'].value;
  const budgetLimit = parseFloat(e.target['budget-limit'].value);
  const savingsGoal = parseFloat(e.target['savings-goal'].value);

  if (!category || !budgetLimit) {
    alert('Fill budget and category properly');
    return;
  }

  // Save or update budget for category
  const existing = budgets.find(b => b.category === category);
  if (existing) {
    existing.budgetLimit = budgetLimit;
    existing.savingsGoal = isNaN(savingsGoal) ? 0 : savingsGoal;
  } else {
    budgets.push({ category, budgetLimit, savingsGoal: isNaN(savingsGoal) ? 0 : savingsGoal });
  }
  localStorage.setItem('budgets', JSON.stringify(budgets));
  addAlert(`Budget/Goal set for ${category}: ₹${budgetLimit.toFixed(2)}, Savings Goal ₹${savingsGoal ? savingsGoal.toFixed(2) : 0} 🔥`);
  e.target.reset();
  updateDashboard();
  checkBudgetAlerts();
});

// ---------- DASHBOARD ----------

// Aggregate expenses per category monthly
function getMonthlyExpenses(yearMonth) {
  // yearMonth = 'YYYY-MM'
  return expenses
    .filter(exp => exp.date.startsWith(yearMonth))
    .reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});
}

function updateExpenseChart() {
  const month = monthSelect.value || getCurrentMonth();
  const data = getMonthlyExpenses(month);

  const chartData = categories.map(cat => data[cat] || 0);
  if (expenseChart) {
    expenseChart.destroy();
  }

  expenseChart = new Chart(expenseChartCtx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        label: 'Expenses',
        data: chartData,
        backgroundColor: [
          '#ff6384',
          '#36a2eb',
          '#ffce56',
          '#4bc0c0',
          '#9966ff',
          '#c9cbcf',
        ],
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
      }
    },
  });
}

function updateGoalProgress() {
  goalListEl.innerHTML = '';

  budgets.forEach(({ category, budgetLimit, savingsGoal }) => {
    const spent = expenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);

    const incomeUsed = (spent / monthlyIncome) * 100;
    const savingsLeft = savingsGoal ? Math.max(savingsGoal - (monthlyIncome - spent), 0) : 0;

    let msg = '';
    if (spent > budgetLimit) {
      msg = `Yo! You totally blasted your ${category} budget. Chill for a bit! 😵‍💫`;
    } else if (spent > budgetLimit * 0.7) {
      msg = `Heads up! You're at ${Math.round((spent / budgetLimit) * 100)}% of your ${category} budget. Keep slayin'! 🔥`;
    } else {
      msg = `All good in ${category} zone. Keep grinding! 💪`;
    }

    if (savingsGoal) {
      if (savingsLeft === 0) {
        msg += ` Also, you smashed your savings goal! 🎉`;
      } else {
        msg += ` Save ₹${savingsLeft.toFixed(2)} more to hit your goal.`;
      }
    }

    const li = document.createElement('li');
    li.textContent = `${category}: Spent ₹${spent.toFixed(2)} / Budget ₹${budgetLimit.toFixed(2)}. ${msg}`;
    goalListEl.appendChild(li);
  });
}

function updateExpenseTable(month) {
  expenseTableBody.innerHTML = '';
  const filtered = expenses.filter(e => e.date.startsWith(month));
  if (filtered.length === 0) {
    expenseTableBody.innerHTML = `<tr><td colspan="4">No expenses for this month 😌</td></tr>`;
    return;
  }
  filtered.sort((a,b) => new Date(a.date) - new Date(b.date));
  filtered.forEach(({date, category, description, amount}) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${date}</td><td>${category}</td><td>${description}</td><td>₹${amount.toFixed(2)}</td>`;
    expenseTableBody.appendChild(tr);
  });
}

function updateDashboard() {
  if (!monthlyIncome) return;
  updateExpenseChart();
  updateGoalProgress();
  updateExpenseTable(monthSelect.value || getCurrentMonth());
  checkBudgetAlerts();
}

// ---------- BUDGET ALERTS ----------
function checkBudgetAlerts() {
  budgets.forEach(({category, budgetLimit}) => {
    const spent = expenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);

    if (spent > budgetLimit) {
      addAlert(`Woaah! You just went over your ${category} budget. Slow down, boss! 🚨`);
    } else if (spent > budgetLimit * 0.9) {
      addAlert(`Yo, only 10% left in your ${category} budget. Don't blow it all! ⚠️`);
    }
  });
}

// ---------- WEEKLY HIGHEST SPENDER ALERT ----------
function getWeekNumber(d) {
  d = new Date(d);
  const onejan = new Date(d.getFullYear(),0,1);
  return Math.ceil((((d - onejan) / 86400000) + onejan.getDay()+1)/7);
}

function sendWeeklyTopCategoryNotification() {
  if (!monthlyIncome) return;
  // Find current week
  const now = new Date();
  const currentWeek = getWeekNumber(now);

  // Group expenses by category in this week
  const weekExpenses = expenses.filter(e => {
    const dt = new Date(e.date);
    return getWeekNumber(dt) === currentWeek && dt.getFullYear() === now.getFullYear();
  });

  if (weekExpenses.length === 0) return;

  const catSpend = {};
  weekExpenses.forEach(e => {
    catSpend[e.category] = (catSpend[e.category] || 0) + e.amount;
  });

  // Find max spender category
  let maxCat = null, maxVal = 0;
  Object.entries(catSpend).forEach(([cat, val]) => {
    if (val > maxVal) {
      maxVal = val;
      maxCat = cat;
    }
  });

  if (maxCat) {
    addAlert(`Yo! This week, you dropped most cash on ${maxCat} - ₹${maxVal.toFixed(2)} 🤑 Keep hustlin' smart!`);
  }
}

// Run weekly notification on page load for demo (in real app, would be scheduled)
window.addEventListener('load', () => {
  if (monthlyIncome) {
    updateDashboard();
    sendWeeklyTopCategoryNotification();
  }
});

// ---------- MONTH SELECTOR ----------
monthSelect.addEventListener('change', () => {
  updateExpenseChart();
  updateExpenseTable(monthSelect.value);
});

// ---------- Initialize ----------
