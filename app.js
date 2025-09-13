const form = document.getElementById('expense-form');
const historyEl = document.getElementById('expense-history');
const categorySelect = document.getElementById('expense-category');
const customWrapper = document.getElementById('custom-category-wrapper');
const customInput = document.getElementById('custom-category-input');
const alertsEl = document.getElementById('alerts');

let expenses = [];
let customCategories = [];

// Auto Categorize
function categorizeExpense(desc) {
  const d = desc.toLowerCase();
  if (d.match(/chicken|rice|food|pizza|cafe|meal|biryani/)) return 'Food';
  if (d.match(/uber|ola|bus|train|fuel/)) return 'Transport';
  if (d.match(/netflix|movie|game|spotify/)) return 'Entertainment';
  if (d.match(/electricity|water|gas|wifi/)) return 'Utilities';
  if (d.match(/loan|emi|credit/)) return 'EMI/Loan';
  return 'Others';
}

// Show alert
function showAlert(msg) {
  const div = document.createElement('div');
  div.textContent = msg;
  alertsEl.appendChild(div);
  setTimeout(() => div.remove(), 5000);
}

// Theme Toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('light');
  document.body.classList.toggle('dark');
});

// Handle custom category logic
categorySelect.addEventListener('change', () => {
  if (categorySelect.value === '__custom__') {
    customWrapper.classList.remove('hidden');
    customInput.focus();
  } else {
    customWrapper.classList.add('hidden');
  }
});

// Add Expense
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const date = form['expense-date'].value;
  const desc = form['expense-desc'].value.trim();
  const amount = parseFloat(form['expense-amount'].value);
  let category = categorySelect.value;

  if (category === '__custom__') {
    category = customInput.value.trim();
    if (!customCategories.includes(category)) {
      customCategories.push(category);
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    }
    customInput.value = '';
    customWrapper.classList.add('hidden');
  }

  if (!category) {
    category = categorizeExpense(desc);
  }

  const expense = { date, desc, amount, category };
  expenses.push(expense);
  updateUI();
  showAlert(`🤑 Spent ₹${amount.toFixed(2)} on ${category}`);
  form.reset();
});

function updateUI() {
  historyEl.innerHTML = '';
  const summary = {};

  expenses.forEach(e => {
    const li = document.createElement('li');
    li.textContent = `${e.date} - ₹${e.amount.toFixed(2)} - ${e.category} 📝 ${e.desc}`;
    historyEl.appendChild(li);

    if (!summary[e.category]) summary[e.category] = 0;
    summary[e.category] += e.amount;
  });

  // Overspend alert
  Object.entries(summary).forEach(([cat, amt]) => {
    if (amt > 1000) showAlert(`🚨 Overspending alert on ${cat}: ₹${amt}`);
    else if (amt > 500) showAlert(`⚠️ You're nearing budget on ${cat} (${amt})`);
  });

  initSpendingChart(summary);
}

// Initialize
updateUI();
