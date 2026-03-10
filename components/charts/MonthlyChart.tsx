'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  date: string
}

interface MonthlyChartProps {
  transactions: Transaction[]
}

export function MonthlyChart({ transactions }: MonthlyChartProps) {
  const data = useMemo(() => {
    const monthlyData: Record<string, { month: string; income: number; expense: number }> = {}
    
    transactions.forEach(t => {
      const date = new Date(t.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('es-ES', { month: 'short' })
      
      if (!monthlyData[key]) {
        monthlyData[key] = { month: monthName, income: 0, expense: 0 }
      }
      
      if (t.type === 'income') {
        monthlyData[key].income += Number(t.amount)
      } else {
        monthlyData[key].expense += Number(t.amount)
      }
    })
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, value]) => value)
  }, [transactions])

  if (data.length === 0) {
    return (
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Resumen mensual</h3>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No hay datos suficientes para mostrar el gráfico
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Resumen mensual</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis 
              dataKey="month" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value === 'income' ? 'Ingresos' : 'Gastos'}</span>}
            />
            <Bar 
              dataKey="income" 
              fill="hsl(var(--income))" 
              radius={[4, 4, 0, 0]}
              name="income"
            />
            <Bar 
              dataKey="expense" 
              fill="hsl(var(--expense))" 
              radius={[4, 4, 0, 0]}
              name="expense"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
