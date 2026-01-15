import { getTransactions, addTransaction, getBalance, getTotals } from './state.js';
import { initCharts, updateCharts } from './charts.js';
import { generateSuggestions } from './analytics.js';

// DOM Elements
const balanceEl = document.getElementById('total-balance');
const incomeEl = document.getElementById('total-income');
const expenseEl = document.getElementById('total-expense');
const transactionsListEl = document.getElementById('transactions-list');
const modal = document.getElementById('modal');
const form = document.getElementById('transaction-form');

// Icons map
const icons = {
    food: 'ri-restaurant-line',
    transport: 'ri-car-line',
    utilities: 'ri-lightbulb-line',
    entertainment: 'ri-movie-line',
    shopping: 'ri-shopping-bag-line',
    health: 'ri-heart-pulse-line',
    salary: 'ri-money-dollar-circle-line',
    other: 'ri-price-tag-3-line'
};

const labels = {
    food: 'Comida',
    transport: 'Transporte',
    utilities: 'Servicios',
    entertainment: 'Entretenimiento',
    shopping: 'Compras',
    health: 'Salud',
    salary: 'Salario',
    other: 'Otro'
};

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

export const renderUI = () => {
    // 1. Update Balance Cards
    const balance = getBalance();
    const totals = getTotals();

    balanceEl.textContent = formatCurrency(balance);
    incomeEl.textContent = `+${formatCurrency(totals.income)}`;
    expenseEl.textContent = `-${formatCurrency(totals.expense)}`;

    // 2. Render Transactions List
    const transactions = getTransactions();
    transactionsListEl.innerHTML = '';

    if (transactions.length === 0) {
        transactionsListEl.innerHTML = `
            <div class="empty-state">
                <i class="ri-file-list-3-line"></i>
                <p>No tienes movimientos registrados.</p>
            </div>
        `;
    } else {
        transactions.forEach(t => {
            const el = document.createElement('div');
            el.className = 'transaction-item';
            const isIncome = t.type === 'income';

            el.innerHTML = `
                <div class="t-info">
                    <div class="t-icon">
                        <i class="${icons[t.category] || icons.other}"></i>
                    </div>
                    <div class="t-details">
                        <h4>${t.description}</h4>
                        <span>${new Date(t.date).toLocaleDateString()} • ${labels[t.category]}</span>
                    </div>
                </div>
                <div class="t-amount ${isIncome ? 'amount-income' : 'amount-expense'}">
                    ${isIncome ? '+' : '-'}${formatCurrency(t.amount)}
                </div>
            `;
            transactionsListEl.appendChild(el);
        });
    }

    // 3. Update Charts & Suggestions
    updateCharts();
    generateSuggestions();
};

export const initApp = () => {
    // Nav Tabs Logic
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));

            // Add active class
            btn.classList.add('active');
            const targetId = `view-${btn.dataset.tab}`;
            const targetView = document.getElementById(targetId);
            targetView.classList.remove('hidden');

            // Trigger chart resize helper
            if (btn.dataset.tab === 'stats') {
                updateCharts('week'); // Default to week view when opening stats
            }
        });
    });

    // Stats Filters Logic
    const customSelector = document.getElementById('custom-date-selector');

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Active state UI
            btn.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (btn.dataset.range === 'custom') {
                customSelector.classList.remove('hidden');
            } else {
                customSelector.classList.add('hidden');
                updateCharts(btn.dataset.range);
            }
        });
    });

    document.getElementById('apply-custom-filter').addEventListener('click', () => {
        const start = document.getElementById('date-start').value;
        const end = document.getElementById('date-end').value;

        if (start && end) {
            updateCharts({ start, end });
        } else {
            alert('Por favor selecciona ambas fechas');
        }
    });

    // Dark Mode Toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        themeToggle.querySelector('i').className = isDark ? 'ri-moon-line' : 'ri-sun-line';
        updateCharts(); // Update chart colors
    });

    // Modal Logic
    const fab = document.getElementById('fab-add');
    const closeBtn = document.getElementById('close-modal');

    fab.addEventListener('click', () => modal.classList.remove('hidden'));
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

    // Form Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const type = form.querySelector('input[name="type"]:checked').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const description = document.getElementById('description').value;
        const category = document.getElementById('category').value;

        addTransaction({
            type,
            amount,
            description,
            category
        });

        form.reset();
        modal.classList.add('hidden');
        renderUI();
    });

    // Initial Render
    initCharts();
    renderUI();
};
