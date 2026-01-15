import { getTransactions } from './state.js';

const suggestionsData = {
    food: "Estás gastando mucho en comida. Prueba cocinar más en casa esta semana.",
    transport: "Tus gastos en transporte son altos. ¿Podrías compartir viaje o usar transporte público?",
    utilities: "Altos gastos en servicios. Recuerda apagar luces y dispositivos que no uses.",
    entertainment: "¡Mucha diversión! Pero considera actividades gratuitas para equilibrar.",
    shopping: "Compras impulsivas detectadas. Prueba la regla de esperar 24h antes de comprar.",
    health: "La salud es prioridad, pero revisa si hay genéricos o alternativas más económicas.",
    other: "Revisa tus gastos 'Varios' para identificar fugas de dinero."
};

export const generateSuggestions = () => {
    const transactions = getTransactions();
    const expenses = transactions.filter(t => t.type === 'expense');

    const container = document.getElementById('suggestions-container');
    container.innerHTML = '';

    if (expenses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="ri-lightbulb-line"></i>
                <p>Agrega gastos para recibir consejos inteligentes.</p>
            </div>
        `;
        return;
    }

    // Calcular gasto total
    const totalExpense = expenses.reduce((acc, cur) => acc + parseFloat(cur.amount), 0);

    // Agrupar por categoría
    const totalsByCategory = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.amount);
        return acc;
    }, {});

    // Encontrar categoría mayor
    const topCategoryEntry = Object.entries(totalsByCategory)
        .sort(([, a], [, b]) => b - a)[0];

    if (!topCategoryEntry) return;

    const [topCategory, amount] = topCategoryEntry;
    const percentage = ((amount / totalExpense) * 100).toFixed(0);

    // Crear tarjeta de sugerencia principal
    const card = document.createElement('div');
    card.className = 'suggestion-card';
    card.innerHTML = `
        <h4 style="margin-bottom:0.5rem; display:flex; align-items:center; gap:0.5rem;">
            <i class="ri-alert-line"></i> Atención en ${getCategoryName(topCategory)}
        </h4>
        <p>El <strong>${percentage}%</strong> de tus gastos mensuales se van en esta categoría.</p>
        <hr style="margin: 0.5rem 0; border: 0; border-top: 1px solid var(--border);">
        <p>💡 ${suggestionsData[topCategory] || suggestionsData.other}</p>
    `;

    container.appendChild(card);

    // Sugerencia genérica de ahorro si no hay mucho saldo
    // (Lógica simple placeholder)
    const card2 = document.createElement('div');
    card2.className = 'suggestion-card';
    card2.style.borderLeftColor = '#10b981'; // Green
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
