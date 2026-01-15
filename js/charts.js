import { getTransactionsByFilter } from './state.js';

let expenseChart = null;
let balanceChart = null; // Nuevo gráfico de barras

const categoryLabels = {
    food: 'Comida',
    transport: 'Transporte',
    utilities: 'Servicios',
    entertainment: 'Entretenimiento',
    shopping: 'Compras',
    health: 'Salud',
    salary: 'Salario',
    other: 'Otro'
};

const categoryColors = {
    food: '#f87171',
    transport: '#f97316',
    utilities: '#eab308',
    entertainment: '#8b5cf6',
    shopping: '#ec4899',
    health: '#14b8a6',
    other: '#64748b'
};

// Formatter helper (duplicated functionality, but good for module isolation in vanilla)
function formatMoney(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

export const initCharts = () => {
    // 1. Doughnut Chart (Gastos por Categoría)
    const ctxExpense = document.getElementById('expenseChart').getContext('2d');
    expenseChart = new Chart(ctxExpense, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                borderWidth: 0
            }]
        },
        options: {
            layout: { padding: 10 },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
                title: { display: true, text: 'Gastos por Categoría' }
            }
        }
    });

    // 2. Bar Chart (Balance Comparativo)
    const ctxBalance = document.getElementById('balanceChart').getContext('2d');
    balanceChart = new Chart(ctxBalance, {
        type: 'bar',
        data: {
            labels: ['Ingresos', 'Gastos'],
            datasets: [{
                label: 'Total',
                data: [0, 0],
                backgroundColor: ['#34d399', '#f87171'], // Green, Red
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Balance del Periodo' }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#e2e8f0' } },
                x: { grid: { display: false } }
            }
        }
    });

    // Render inicial (Semana por defecto)
    updateCharts('week');
};

export const updateCharts = (filterRange = 'week') => {
    if (!expenseChart || !balanceChart) return;

    const filteredTransactions = getTransactionsByFilter(filterRange);

    // --- Data Processing ---

    // 1. Totals for Bar Chart
    let totalIncome = 0;
    let totalExpense = 0;

    // 2. Breakdown for Doughnut Chart
    const expenseByCategory = {};

    filteredTransactions.forEach(t => {
        const amount = parseFloat(t.amount);
        if (t.type === 'income') {
            totalIncome += amount;
        } else {
            totalExpense += amount;
            expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + amount;
        }
    });

    // --- DOM Updates (Summary Cards) ---
    document.getElementById('period-income').textContent = formatMoney(totalIncome);
    document.getElementById('period-expense').textContent = formatMoney(totalExpense);
    document.getElementById('period-balance').textContent = formatMoney(totalIncome - totalExpense);

    // --- Chart Updates ---

    // Bar Chart
    balanceChart.data.datasets[0].data = [totalIncome, totalExpense];

    // Dark Mode Checks
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f1f5f9' : '#334155';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    balanceChart.options.plugins.title.color = textColor;
    balanceChart.options.scales.y.grid.color = gridColor;
    balanceChart.update();

    // Doughnut Chart
    const labels = Object.keys(expenseByCategory).map(key => categoryLabels[key]);
    const data = Object.values(expenseByCategory);
    const backgroundColors = Object.keys(expenseByCategory).map(key => categoryColors[key] || '#64748b');

    expenseChart.data.labels = labels;
    expenseChart.data.datasets[0].data = data;
    expenseChart.data.datasets[0].backgroundColor = backgroundColors;

    expenseChart.options.plugins.legend.labels.color = isDark ? '#cadae6' : '#475569';
    expenseChart.options.plugins.title.color = textColor;

    expenseChart.update();

    renderBreakdown(expenseByCategory);
};

function renderBreakdown(totals) {
    const container = document.getElementById('stats-breakdown');
    container.innerHTML = '<h4>Detalle de Gastos</h4>';

    const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a);

    if (sorted.length === 0) {
        container.innerHTML += '<p style="text-align:center; color:var(--text-muted); padding:1rem; font-size:0.9rem">No hay gastos en este periodo</p>';
        return;
    }

    const list = document.createElement('div');
    sorted.forEach(([cat, amount]) => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.style.marginBottom = '0.5rem';
        item.innerHTML = `
            <div class="t-info">
                <div class="t-icon" style="color: ${categoryColors[cat]}"><i class="ri-pie-chart-fill"></i></div>
                <div class="t-details">
                    <h4>${categoryLabels[cat]}</h4>
                </div>
            </div>
            <div class="t-amount amount-expense">-${formatMoney(amount)}</div>
        `;
        list.appendChild(item);
    });

    container.appendChild(list);
}
