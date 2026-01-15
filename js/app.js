// --- STATE MODULE ---
const STORAGE_KEY = 'finance_app_data_v1';

// Estado inicial
let state = {
    transactions: [],
    ...loadData()
};

function loadData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : { transactions: [] };
    } catch (e) {
        console.error("Error cargando datos:", e);
        return { transactions: [] };
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Variables globales para edición
let editingId = null;

// Actions
const getAllTransactions = () => {
    return [...state.transactions].sort((a, b) => b.id - a.id);
};

// Por defecto devuelve solo el mes actual
const getTransactions = (monthOffset = 0) => {
    const now = new Date();
    // Ajustar mes basado en offset (0 = actual, -1 = anterior, etc)
    const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);

    return state.transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === targetDate.getMonth() &&
            tDate.getFullYear() === targetDate.getFullYear();
    }).sort((a, b) => b.id - a.id);
};

const getTransactionById = (id) => {
    return state.transactions.find(t => t.id === id);
};

// Mantenemos esta para las gráficas que ya tienen su lógica de filtrado interno
const getTransactionsByFilter = (range) => {
    const now = new Date();
    // Para filtros globales usamos todas las transacciones
    const transactions = getAllTransactions();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return transactions.filter(t => {
        const tDate = new Date(t.date);
        const tDateNormalized = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());

        if (range === 'week') {
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 7);
            return tDateNormalized >= lastWeek && tDateNormalized <= today;
        } else if (range === 'month') {
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        } else if (range === 'year') {
            return tDate.getFullYear() === now.getFullYear();
        } else if (typeof range === 'object' && range.start && range.end) {
            const start = new Date(range.start);
            const end = new Date(range.end);
            end.setHours(23, 59, 59, 999);
            return tDate >= start && tDate <= end;
        }
        return true;
    });
};

const addTransaction = (transaction) => {
    const newTransaction = {
        id: Date.now(),
        date: new Date().toISOString(),
        ...transaction
    };
    state.transactions.push(newTransaction);
    saveData();
    return newTransaction;
};

const updateTransaction = (id, updatedData) => {
    const index = state.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        state.transactions[index] = {
            ...state.transactions[index],
            ...updatedData
        };
        saveData();
    }
};

const deleteTransaction = (id) => {
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveData();
};

const getBalance = (transactions) => {
    return transactions.reduce((acc, curr) => {
        if (curr.type === 'income') return acc + parseFloat(curr.amount);
        return acc - parseFloat(curr.amount);
    }, 0);
};

const getTotals = (transactions) => {
    return transactions.reduce((acc, curr) => {
        const amount = parseFloat(curr.amount);
        if (curr.type === 'income') {
            acc.income += amount;
        } else {
            acc.expense += amount;
        }
        return acc;
    }, { income: 0, expense: 0 });
};

// --- REPORTING MODULE ---
const generatePreviousMonthReport = () => {
    const prevMonthTransactions = getTransactions(-1);
    const totals = getTotals(prevMonthTransactions);
    const balance = totals.income - totals.expense;

    const now = new Date();
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthName = prevMonthDate.toLocaleString('es-CO', { month: 'long', year: 'numeric' });

    // Calcular categoría de mayor gasto
    const expenses = prevMonthTransactions.filter(t => t.type === 'expense');
    const expenseByCategory = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.amount);
        return acc;
    }, {});

    const topCategoryEntry = Object.entries(expenseByCategory).sort(([, a], [, b]) => b - a)[0];
    const topCategory = topCategoryEntry ? getCategoryName(topCategoryEntry[0]) : 'Ninguna';

    // Mensaje personalizado
    let advice = "";
    if (balance > 0) {
        advice = "¡Excelente! Lograste un superávit. Considera invertir ese excedente.";
    } else if (balance < 0) {
        advice = "Cuidado, gastaste más de lo que ingresaste. Revisa tus gastos hormiga.";
    } else {
        advice = "Equilibrio total. Ni ganancia ni pérdida.";
    }

    // Si no hubo movimientos
    if (prevMonthTransactions.length === 0) {
        Swal.fire({
            title: `Reporte de ${monthName}`,
            text: "No registraste movimientos el mes pasado.",
            icon: 'info',
            background: document.body.getAttribute('data-theme') === 'dark' ? '#1e293b' : '#ffffff',
            color: document.body.getAttribute('data-theme') === 'dark' ? '#f1f5f9' : '#1e293b'
        });
        return;
    }

    Swal.fire({
        title: `<span style="font-size: 1.2rem">Reporte Mensual</span><br><small style="opacity:0.7">${monthName}</small>`,
        html: `
            <div style="text-align: left; margin-top: 1rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem">
                    <span>Ingresos:</span>
                    <span style="color:#10b981">${formatCurrency(totals.income)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem">
                    <span>Gastos:</span>
                    <span style="color:#ef4444">${formatCurrency(totals.expense)}</span>
                </div>
                <hr style="border-color:var(--border); margin: 0.5rem 0">
                <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.1rem">
                    <span>Balance:</span>
                    <span style="${balance >= 0 ? 'color:#10b981' : 'color:#ef4444'}">${formatCurrency(balance)}</span>
                </div>
                
                <div style="margin-top: 1.5rem; background: var(--bg-hover); padding: 1rem; border-radius: 8px;">
                    <p style="margin-bottom: 0.5rem; font-size: 0.9rem; opacity: 0.8">Mayor gasto en:</p>
                    <strong style="font-size: 1rem"><i class="ri-price-tag-3-fill"></i> ${topCategory}</strong>
                </div>

                <p style="margin-top: 1rem; font-style: italic; font-size: 0.95rem; text-align: center">"${advice}"</p>
            </div>
        `,
        icon: balance >= 0 ? 'success' : 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3b82f6',
        background: document.body.getAttribute('data-theme') === 'dark' ? '#1e293b' : '#ffffff',
        color: document.body.getAttribute('data-theme') === 'dark' ? '#f1f5f9' : '#1e293b',
        customClass: {
            popup: 'report-popup'
        }
    });
};

// --- CHARTS MODULE ---
let expenseChart = null;
let balanceChart = null;

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

function formatMoney(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

const initCharts = () => {
    // 1. Doughnut Chart
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

    // 2. Bar Chart
    const ctxBalance = document.getElementById('balanceChart').getContext('2d');
    balanceChart = new Chart(ctxBalance, {
        type: 'bar',
        data: {
            labels: ['Ingresos', 'Gastos'],
            datasets: [{
                label: 'Total',
                data: [0, 0],
                backgroundColor: ['#34d399', '#f87171'],
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

    updateCharts('week');
};

const updateCharts = (filterRange = 'week') => {
    if (!expenseChart || !balanceChart) return;

    const filteredTransactions = getTransactionsByFilter(filterRange);

    let totalIncome = 0;
    let totalExpense = 0;
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

    // DOM Updates
    document.getElementById('period-income').textContent = formatMoney(totalIncome);
    document.getElementById('period-expense').textContent = formatMoney(totalExpense);
    document.getElementById('period-balance').textContent = formatMoney(totalIncome - totalExpense);

    // Update Bar Chart
    balanceChart.data.datasets[0].data = [totalIncome, totalExpense];

    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f1f5f9' : '#334155';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    balanceChart.options.plugins.title.color = textColor;
    balanceChart.options.scales.y.grid.color = gridColor;
    balanceChart.update();

    // Update Doughnut Chart
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

// --- ANALYTICS MODULE ---
const suggestionsData = {
    food: "Estás gastando mucho en comida. Prueba cocinar más en casa esta semana.",
    transport: "Tus gastos en transporte son altos. ¿Podrías compartir viaje o usar transporte público?",
    utilities: "Altos gastos en servicios. Recuerda apagar luces y dispositivos que no uses.",
    entertainment: "¡Mucha diversión! Pero considera actividades gratuitas para equilibrar.",
    shopping: "Compras impulsivas detectadas. Prueba la regla de esperar 24h antes de comprar.",
    health: "La salud es prioridad, pero revisa si hay genéricos o alternativas más económicas.",
    other: "Revisa tus gastos 'Varios' para identificar fugas de dinero."
};

const generateSuggestions = () => {
    // Sugerencias basadas en el mes actual
    const transactions = getTransactions(0);
    const expenses = transactions.filter(t => t.type === 'expense');
    const container = document.getElementById('suggestions-container');
    container.innerHTML = '';

    if (expenses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="ri-lightbulb-line"></i>
                <p>Agrega gastos este mes para recibir consejos inteligentes.</p>
            </div>
        `;
        return;
    }

    const totalExpense = expenses.reduce((acc, cur) => acc + parseFloat(cur.amount), 0);

    const totalsByCategory = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.amount);
        return acc;
    }, {});

    const topCategoryEntry = Object.entries(totalsByCategory)
        .sort(([, a], [, b]) => b - a)[0];

    if (!topCategoryEntry) return;

    const [topCategory, amount] = topCategoryEntry;
    const percentage = ((amount / totalExpense) * 100).toFixed(0);

    const card = document.createElement('div');
    card.className = 'suggestion-card';
    card.innerHTML = `
        <h4 style="margin-bottom:0.5rem; display:flex; align-items:center; gap:0.5rem;">
            <i class="ri-alert-line"></i> Atención en ${getCategoryName(topCategory)}
        </h4>
        <p>El <strong>${percentage}%</strong> de tus gastos del mes se van en esta categoría.</p>
        <hr style="margin: 0.5rem 0; border: 0; border-top: 1px solid var(--border);">
        <p>💡 ${suggestionsData[topCategory] || suggestionsData.other}</p>
    `;

    container.appendChild(card);

    const card2 = document.createElement('div');
    card2.className = 'suggestion-card';
    card2.style.borderLeftColor = '#10b981';
    card2.innerHTML = `
        <h4 style="margin-bottom:0.5rem">Regla 50/30/20</h4>
        <p>Intenta destinar el 20% de tus ingresos al ahorro. Es un buen hábito para empezar.</p>
    `;
    container.appendChild(card2);
};

function getCategoryName(key) {
    const map = {
        food: 'Comida',
        transport: 'Transporte',
        utilities: 'Servicios',
        entertainment: 'Entretenimiento',
        shopping: 'Compras',
        health: 'Salud',
        other: 'Varios'
    };
    return map[key] || key;
}

// --- UI MODULE ---
const balanceEl = document.getElementById('total-balance');
const incomeEl = document.getElementById('total-income');
const expenseEl = document.getElementById('total-expense');
const transactionsListEl = document.getElementById('transactions-list');
const modal = document.getElementById('modal');
const form = document.getElementById('transaction-form');

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

const renderUI = () => {
    // 1. Obtener transacciones SOLAMENTE del mes actual para la vista principal
    const currentMonthTransactions = getTransactions(0);

    // 2. Calcular balance basado en estas transacciones filtradas
    const balance = getBalance(currentMonthTransactions);
    const totals = getTotals(currentMonthTransactions);

    balanceEl.textContent = formatCurrency(balance);
    incomeEl.textContent = `+${formatCurrency(totals.income)}`;
    expenseEl.textContent = `-${formatCurrency(totals.expense)}`;

    transactionsListEl.innerHTML = '';

    if (currentMonthTransactions.length === 0) {
        transactionsListEl.innerHTML = `
            <div class="empty-state">
                <i class="ri-calendar-check-line"></i>
                <p>No hay movimientos este mes.</p>
            </div>
        `;
    } else {
        currentMonthTransactions.forEach(t => {
            const el = document.createElement('div');
            el.className = 'transaction-item';
            const isIncome = t.type === 'income';

            // Estructura actualizada con botones de acción
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
                <div style="display: flex; gap: 8px; align-items: center;">
                    <div class="t-amount ${isIncome ? 'amount-income' : 'amount-expense'}" style="margin-right:0.5rem">
                        ${isIncome ? '+' : '-'}${formatCurrency(t.amount)}
                    </div>
                    <button class="icon-btn edit-btn" data-id="${t.id}" aria-label="Editar" style="padding: 4px; color: var(--text-muted);">
                         <i class="ri-pencil-line"></i>
                    </button>
                    <button class="icon-btn delete-btn" data-id="${t.id}" aria-label="Eliminar" style="padding: 4px; color: #ef4444;">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            `;
            transactionsListEl.appendChild(el);
        });
    }

    updateCharts();
    generateSuggestions();
    checkReportAvailability();
};

const checkReportAvailability = () => {
    const reportBtn = document.getElementById('report-btn');
    if (!reportBtn) return;

    // Verificar si hay datos del mes anterior
    const prevMonthData = getTransactions(-1);

    if (prevMonthData.length > 0) {
        reportBtn.style.display = 'flex';
    } else {
        reportBtn.style.display = 'none';
    }
};

const initApp = () => {
    // Nav Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));

            btn.classList.add('active');
            const targetId = `view-${btn.dataset.tab}`;
            document.getElementById(targetId).classList.remove('hidden');

            if (btn.dataset.tab === 'stats') {
                updateCharts('week');
            }
        });
    });

    // Filters
    const customSelector = document.getElementById('custom-date-selector');
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
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

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        themeToggle.querySelector('i').className = isDark ? 'ri-moon-line' : 'ri-sun-line';
        updateCharts();
    });

    // Report Button
    const reportBtn = document.getElementById('report-btn');
    if (reportBtn) {
        reportBtn.addEventListener('click', generatePreviousMonthReport);
    }

    // Modal
    const fab = document.getElementById('fab-add');
    const closeBtn = document.getElementById('close-modal');

    // Función para abrir modal en modo "Nuevo"
    const openModalNew = () => {
        editingId = null;
        form.reset();
        document.querySelector('.modal-header h3').textContent = 'Nuevo Movimiento';
        document.getElementById('type-expense').checked = true;
        modal.classList.remove('hidden');
    };

    fab.addEventListener('click', openModalNew);

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        editingId = null;
    });

    // Event Delegation para Editar y Eliminar
    transactionsListEl.addEventListener('click', (e) => {
        // Buscar el botón o el icono dentro del botón
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (deleteBtn) {
            const id = parseInt(deleteBtn.dataset.id);

            Swal.fire({
                title: '¿Eliminar movimiento?',
                text: "No podrás revertir esta acción",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
                background: document.body.getAttribute('data-theme') === 'dark' ? '#1e293b' : '#ffffff',
                color: document.body.getAttribute('data-theme') === 'dark' ? '#f1f5f9' : '#1e293b',
                customClass: {
                    popup: 'swal2-dark-mode-popup'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    deleteTransaction(id);
                    renderUI();

                    Swal.fire({
                        title: '¡Eliminado!',
                        text: 'El movimiento ha sido eliminado.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                        background: document.body.getAttribute('data-theme') === 'dark' ? '#1e293b' : '#ffffff',
                        color: document.body.getAttribute('data-theme') === 'dark' ? '#f1f5f9' : '#1e293b'
                    });
                }
            });
        }
        else if (editBtn) {
            const id = parseInt(editBtn.dataset.id);
            const transaction = getTransactionById(id);

            if (transaction) {
                editingId = id;
                document.querySelector('.modal-header h3').textContent = 'Editar Movimiento';

                // Rellenar formulario
                document.getElementById('amount').value = transaction.amount;
                document.getElementById('description').value = transaction.description;
                document.getElementById('category').value = transaction.category;

                if (transaction.type === 'income') {
                    document.getElementById('type-income').checked = true;
                } else {
                    document.getElementById('type-expense').checked = true;
                }

                modal.classList.remove('hidden');
            }
        }
    });

    // Form
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = form.querySelector('input[name="type"]:checked').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const description = document.getElementById('description').value;
        const category = document.getElementById('category').value;

        if (editingId) {
            updateTransaction(editingId, { type, amount, description, category });
        } else {
            addTransaction({ type, amount, description, category });
        }

        form.reset();
        editingId = null;
        modal.classList.add('hidden');
        renderUI();
    });

    // --- DATA SEEDING FOR DEMO ---
    const seedKey = 'demo_seed_v2';
    if (!localStorage.getItem(seedKey)) {
        const now = new Date();
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15); // 15th of prev month

        addTransaction({
            type: 'expense',
            amount: 45000,
            category: 'food',
            description: 'Cena Demo (Mes Pasado)',
            date: prevMonthDate.toISOString()
        });

        localStorage.setItem(seedKey, 'true');
        console.log('Datos de prueba del mes pasado generados.');
    }

    initCharts();
    renderUI();
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});
