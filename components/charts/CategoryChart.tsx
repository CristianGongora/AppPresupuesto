'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
}

interface CategoryChartProps {
  transactions: Transaction[]
  type: 'income' | 'expense'
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(220, 14%, 50%)',
]

export function CategoryChart({ transactions, type }: CategoryChartProps) {
  const data = useMemo(() => {
    const categoryData: Record<string, number> = {}
    
    transactions
      .filter(t => t.type === type)
      .forEach(t => {
        if (!categoryData[t.category]) {
          categoryData[t.category] = 0
        }
        categoryData[t.category] += Number(t.amount)
      })
    
    return Object.entries(categoryData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [transactions, type])

  const title = type === 'income' ? 'Ingresos por categoría' : 'Gastos por categoría'
  const emptyMessage = type === 'income' ? 'No hay ingresos registrados' : 'No hay gastos registrados'

  if (data.length === 0) {
    return (
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          {emptyMessage}
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
                fontSize: '12px'
              }}
            />
            <Legend 
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--foreground))', fontSize: '11px' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
