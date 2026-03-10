'use client'

import { formatCurrency } from '@/lib/utils'
import { useLanguage } from './LanguageProvider'

interface StatsCardsProps {
  totalIncome: number
  totalExpense: number
  balance: number
}

export function StatsCards({ totalIncome, totalExpense, balance }: StatsCardsProps) {
  const { t } = useLanguage()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      {/* Income Card */}
      <div className="stat-card group">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">{t('dashboard.totalIncome')}</span>
          <div className="w-10 h-10 rounded-lg bg-income/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 text-income" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-foreground">
          {formatCurrency(totalIncome)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">Total acumulado</p>
      </div>

      {/* Expense Card */}
      <div className="stat-card group">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">{t('dashboard.totalExpense')}</span>
          <div className="w-10 h-10 rounded-lg bg-expense/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 text-expense" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-foreground">
          {formatCurrency(totalExpense)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">Total acumulado</p>
      </div>

      {/* Balance Card */}
      <div className="stat-card group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">{t('dashboard.balance')}</span>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
              balance >= 0 ? 'bg-income/10' : 'bg-expense/10'
            }`}>
              <svg className={`w-5 h-5 ${balance >= 0 ? 'text-income' : 'text-expense'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
            {formatCurrency(balance)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {balance >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
          </p>
        </div>
      </div>
    </div>
  )
}
