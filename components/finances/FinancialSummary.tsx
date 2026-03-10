'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '../LanguageProvider'

interface FinancialSummaryProps {
  userId: string
  refreshKey: number
}

interface Summary {
  totalAccounts: number
  totalCredits: number
  totalCDTs: number
  accountsBalance: number
  creditsDebt: number
  cdtsInvested: number
  cdtsExpectedReturn: number
  netWorth: number
}

export function FinancialSummary({ userId, refreshKey }: FinancialSummaryProps) {
  const supabase = createClient()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    async function loadSummary() {
      const [accountsRes, creditsRes, cdtsRes] = await Promise.all([
        supabase.from('bank_accounts').select('*').eq('user_id', userId).eq('is_active', true),
        supabase.from('credits').select('*').eq('user_id', userId).eq('is_active', true),
        supabase.from('cdts').select('*').eq('user_id', userId).eq('status', 'active'),
      ])

      const accounts = accountsRes.data || []
      const credits = creditsRes.data || []
      const cdts = cdtsRes.data || []

      const accountsBalance = accounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0)
      const creditsDebt = credits.reduce((sum, cred) => sum + Number(cred.current_balance), 0)
      const cdtsInvested = cdts.reduce((sum, cdt) => sum + Number(cdt.initial_amount), 0)
      const cdtsExpectedReturn = cdts.reduce((sum, cdt) => sum + Number(cdt.expected_return), 0)

      setSummary({
        totalAccounts: accounts.length,
        totalCredits: credits.length,
        totalCDTs: cdts.length,
        accountsBalance,
        creditsDebt,
        cdtsInvested,
        cdtsExpectedReturn,
        netWorth: accountsBalance + cdtsInvested + cdtsExpectedReturn - creditsDebt,
      })
      setLoading(false)
    }

    loadSummary()
  }, [supabase, userId, refreshKey])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-6 border border-border animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-3" />
            <div className="h-8 bg-muted rounded w-32" />
          </div>
        ))}
      </div>
    )
  }

  if (!summary) return null

  const cards = [
    {
      title: t('finances.netWorth'),
      value: summary.netWorth,
      subtitle: t('finances.totalBalance'),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: summary.netWorth >= 0 ? 'text-income' : 'text-expense',
      bgColor: summary.netWorth >= 0 ? 'bg-income/10' : 'bg-expense/10',
    },
    {
      title: 'Cuentas Bancarias',
      value: summary.accountsBalance,
      subtitle: `${summary.totalAccounts} cuenta${summary.totalAccounts !== 1 ? 's' : ''}`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Deuda Total',
      value: summary.creditsDebt,
      subtitle: `${summary.totalCredits} credito${summary.totalCredits !== 1 ? 's' : ''}`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'text-expense',
      bgColor: 'bg-expense/10',
    },
    {
      title: 'CDTs Activos',
      value: summary.cdtsInvested,
      subtitle: `Retorno esperado: ${formatCurrency(summary.cdtsExpectedReturn)}`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className={`text-2xl font-bold mt-1 ${card.color}`}>
                {formatCurrency(card.value)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            </div>
            <div className={`p-3 rounded-lg ${card.bgColor}`}>
              <span className={card.color}>{card.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
