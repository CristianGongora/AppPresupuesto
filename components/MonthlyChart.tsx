'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function MonthlyChart({ transactions }: { transactions: any[] }) {
  // Agrupar transacciones por mes
  const monthlyData: { [key: string]: { income: number; expense: number } } = {}

  transactions.forEach((t) => {
    const date = new Date(t.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expense: 0 }
    }

    if (t.type === 'income') {
      monthlyData[monthKey].income += t.amount
    } else {
      monthlyData[monthKey].expense += t.amount
    }
  })

  const chartData = Object.entries(monthlyData)
    .sort()
    .map(([month, data]) => ({
      month: new Date(`${month}-01`).toLocaleDateString('es-ES', {
        month: 'short',
        year: '2-digit',
      }),
      Ingresos: data.income,
      Gastos: data.expense,
    }))

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Resumen Mensual</h2>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="Ingresos" fill="#10b981" />
            <Bar dataKey="Gastos" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-500 text-center py-8">Sin datos para mostrar</p>
      )}
    </div>
  )
}
