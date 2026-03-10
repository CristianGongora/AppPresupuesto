'use client'

import { useEffect, useState } from 'react'
import { Transaction } from '@/lib/utils'

interface AISuggestionsProps {
  transactions: Transaction[]
  onOpenChat: () => void
}

interface Suggestion {
  id: string
  type: 'warning' | 'tip' | 'achievement' | 'insight'
  title: string
  message: string
  action?: string
}

export function AISuggestions({ transactions, onOpenChat }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyzeTransactions()
  }, [transactions])

  function analyzeTransactions() {
    const newSuggestions: Suggestion[] = []
    
    if (transactions.length === 0) {
      setSuggestions([{
        id: 'welcome',
        type: 'tip',
        title: 'Comienza a registrar',
        message: 'Agrega tus primeras transacciones para recibir consejos personalizados sobre tu salud financiera.',
        action: 'Agregar transaccion'
      }])
      setLoading(false)
      return
    }

    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    // Filter this month's transactions
    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear
    })

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // Category analysis
    const expensesByCategory = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    const sortedCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)

    // Generate suggestions based on analysis

    // 1. Spending vs Income ratio
    if (monthlyIncome > 0 && monthlyExpenses > monthlyIncome * 0.9) {
      newSuggestions.push({
        id: 'high-spending',
        type: 'warning',
        title: 'Gastos elevados',
        message: `Estas gastando el ${Math.round((monthlyExpenses / monthlyIncome) * 100)}% de tus ingresos este mes. Considera revisar tus gastos no esenciales.`,
        action: 'Ver detalle'
      })
    } else if (monthlyIncome > 0 && monthlyExpenses < monthlyIncome * 0.5) {
      newSuggestions.push({
        id: 'good-savings',
        type: 'achievement',
        title: 'Excelente ahorro',
        message: `Estas ahorrando mas del 50% de tus ingresos. Considera invertir parte de ese ahorro en un CDT o fondo de inversion.`,
        action: 'Ver opciones'
      })
    }

    // 2. Top spending category
    if (sortedCategories.length > 0) {
      const [topCategory, topAmount] = sortedCategories[0]
      const percentage = monthlyExpenses > 0 ? Math.round((topAmount / monthlyExpenses) * 100) : 0
      
      if (percentage > 40) {
        newSuggestions.push({
          id: 'top-category',
          type: 'insight',
          title: `${topCategory} representa el ${percentage}%`,
          message: `Tu mayor gasto este mes es en ${topCategory}. Busca alternativas o establece un presupuesto para esta categoria.`,
          action: 'Analizar'
        })
      }
    }

    // 3. Savings tip
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0
    if (savingsRate > 0 && savingsRate < 20) {
      newSuggestions.push({
        id: 'savings-tip',
        type: 'tip',
        title: 'Aumenta tu ahorro',
        message: 'Los expertos recomiendan ahorrar al menos el 20% de tus ingresos. Intenta reducir gastos en entretenimiento o suscripciones.',
        action: 'Ver consejos'
      })
    }

    // 4. Emergency fund reminder
    const totalBalance = transactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount)
    }, 0)

    if (totalBalance < monthlyExpenses * 3) {
      newSuggestions.push({
        id: 'emergency-fund',
        type: 'tip',
        title: 'Fondo de emergencia',
        message: 'Idealmente deberias tener al menos 3 meses de gastos ahorrados para emergencias. Considera priorizar este objetivo.',
        action: 'Crear plan'
      })
    }

    // 5. Positive balance achievement
    if (monthlyIncome > monthlyExpenses && monthlyTransactions.length >= 5) {
      newSuggestions.push({
        id: 'positive-balance',
        type: 'achievement',
        title: 'Balance positivo',
        message: `Este mes tienes un excedente de ${(monthlyIncome - monthlyExpenses).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}. Sigue asi!`,
      })
    }

    // Limit to 3 suggestions
    setSuggestions(newSuggestions.slice(0, 3))
    setLoading(false)
  }

  const getIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'warning':
        return (
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'tip':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      case 'achievement':
        return (
          <svg className="w-5 h-5 text-income" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        )
      case 'insight':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getBgColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'warning': return 'bg-amber-500/10 border-amber-500/20'
      case 'tip': return 'bg-blue-500/10 border-blue-500/20'
      case 'achievement': return 'bg-income/10 border-income/20'
      case 'insight': return 'bg-purple-500/10 border-purple-500/20'
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-foreground animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Analizando tus finanzas...</h3>
            <p className="text-sm text-muted-foreground">Preparando sugerencias personalizadas</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Sugerencias IA</h3>
            <p className="text-sm text-muted-foreground">Basadas en tus transacciones</p>
          </div>
        </div>
        <button
          onClick={onOpenChat}
          className="text-sm text-primary hover:text-primary/80 transition flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Hablar con IA
        </button>
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-muted-foreground">Todo se ve bien por ahora</p>
          <p className="text-sm text-muted-foreground">Sigue registrando tus transacciones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`p-4 rounded-lg border transition hover:scale-[1.01] ${getBgColor(suggestion.type)}`}
            >
              <div className="flex items-start gap-3">
                {getIcon(suggestion.type)}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm">{suggestion.title}</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">{suggestion.message}</p>
                  {suggestion.action && (
                    <button
                      onClick={onOpenChat}
                      className="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition"
                    >
                      {suggestion.action} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
