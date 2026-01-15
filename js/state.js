const STORAGE_KEY = 'finance_app_data_v1';

// Estado inicial
let state = {
    transactions: [],
    ...loadData()
};

function loadData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        // Migración simple si es necesario
        return stored ? JSON.parse(stored) : { transactions: [] };
    } catch (e) {
        console.error("Error cargando datos:", e);
        return { transactions: [] };
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Actions
export const getTransactions = () => {
    return [...state.transactions].sort((a, b) => b.id - a.id);
};

export const getTransactionsByFilter = (range) => {
    const now = new Date();
    const transactions = getTransactions();

    // Normalizar inicio del día para comparaciones justas
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return transactions.filter(t => {
        const tDate = new Date(t.date);
        const tDateNormalized = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());

        if (range === 'week') {
            // Últimos 7 días
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 7);
            return tDateNormalized >= lastWeek && tDateNormalized <= today;
        } else if (range === 'month') {
            // Mes actual
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        } else if (range === 'year') {
            // Año actual
            return tDate.getFullYear() === now.getFullYear();
        } else if (typeof range === 'object' && range.start && range.end) {
            // Rango personalizado
            const start = new Date(range.start);
            const end = new Date(range.end);
            // Ajustar end al final del día
            end.setHours(23, 59, 59, 999);
            return tDate >= start && tDate <= end;
        }
        return true; // All
    });
};

export const addTransaction = (transaction) => {
    const newTransaction = {
        id: Date.now(),
        date: new Date().toISOString(),
        ...transaction
    };
    state.transactions.push(newTransaction);
    saveData();
    return newTransaction;
};

export const getBalance = () => {
    return state.transactions.reduce((acc, curr) => {
        if (curr.type === 'income') return acc + parseFloat(curr.amount);
        return acc - parseFloat(curr.amount);
    }, 0);
};

export const getTotals = () => {
    return state.transactions.reduce((acc, curr) => {
        const amount = parseFloat(curr.amount);
        if (curr.type === 'income') {
            acc.income += amount;
        } else {
            acc.expense += amount;
        }
        return acc;
    }, { income: 0, expense: 0 });
};

export const deleteTransaction = (id) => {
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveData();
};
