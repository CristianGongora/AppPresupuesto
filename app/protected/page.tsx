'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/components/LanguageProvider'
import { ThemeToggle } from '@/components/ThemeToggle'
import { TransactionModal } from '@/components/TransactionModal'
import { StatsCards } from '@/components/StatsCards'
import { TransactionList } from '@/components/TransactionList'
import { MonthlyChart } from '@/components/charts/MonthlyChart'
import { CategoryChart } from '@/components/charts/CategoryChart'
import { AIAssistant } from '@/components/AIAssistant'
import { AISuggestions } from '@/components/AISuggestions'
import { TransactionFilters, FilterState } from '@/components/TransactionFilters'

// Re-export Transaction from utils for backward compatibility
export type { Transaction } from '@/lib/utils'
import type { Transaction } from '@/lib/utils'

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()
  
  const [user, setUser] = useState<{ email: string; id: string; displayName: string } | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    category: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    searchTerm: '',
  })

  useEffect(() => {
    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Obtener el nombre del perfil
      const displayName = authUser.user_metadata?.display_name || 
                          authUser.email?.split('@')[0] || 
                          'Usuario'

      setUser({ 
        email: authUser.email || '', 
        id: authUser.id,
        displayName 
      })
      await loadTransactions(authUser.id)
      setLoading(false)
    }

    loadData()
  }, [supabase, router])

  async function loadTransactions(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (!error && data) {
      setTransactions(data)
    }
  }

  async function handleAddTransaction(transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) {
    if (!user) return

    const { error } = await supabase
      .from('transactions')
      .insert([{ ...transaction, user_id: user.id }])

    if (!error) {
      await loadTransactions(user.id)
      setShowTransactionModal(false)
    }
  }

  async function handleDeleteTransaction(id: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (!error && user) {
      await loadTransactions(user.id)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando tu dashboard...</p>
        </div>
      </div>
    )
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  const balance = totalIncome - totalExpense

  // Apply filters
  const filteredTransactions = transactions.filter(t => {
    if (filters.type !== 'all' && t.type !== filters.type) return false
    if (filters.category && t.category !== filters.category) return false
    if (filters.dateFrom && t.date < filters.dateFrom) return false
    if (filters.dateTo && t.date > filters.dateTo) return false
    if (filters.amountMin && t.amount < parseFloat(filters.amountMin)) return false
    if (filters.amountMax && t.amount > parseFloat(filters.amountMax)) return false
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase()
      if (!t.description.toLowerCase().includes(search) && 
          !t.category.toLowerCase().includes(search)) return false
    }
    return true
  })

  const categories = [...new Set(transactions.map(t => t.category))]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-semibold gradient-text hidden sm:block">FinanceAI</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* AI Assistant Button */}
              <button
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  showAIAssistant 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-secondary/80 text-foreground'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="hidden sm:inline text-sm font-medium">{t('dashboard.ai')}</span>
              </button>

              <Link
                href="/protected/finances"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                title="Productos Financieros"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="hidden sm:inline text-sm font-medium">{t('dashboard.finances')}</span>
              </Link>

              <ThemeToggle />
              
              <Link
                href="/protected/settings"
                className="p-2.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                title="Configuración"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                title="Cerrar sesión"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t('dashboard.welcome')}, {user?.displayName}
            </h1>
          </div>
          <button
            onClick={() => setShowTransactionModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:scale-105 font-medium shadow-lg shadow-primary/25"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('dashboard.newTransaction')}
          </button>
        </div>

        {/* Stats Cards */}
        <StatsCards 
          totalIncome={totalIncome} 
          totalExpense={totalExpense} 
          balance={balance} 
        />

        {/* AI Suggestions */}
        <div className="mt-8">
          <AISuggestions 
            transactions={transactions} 
            onOpenChat={() => setShowAIAssistant(true)} 
          />
        </div>

        {/* Filters */}
        <div className="mt-6">
          <TransactionFilters
            filters={filters}
            onFiltersChange={setFilters}
            categories={categories}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-6">
            <MonthlyChart transactions={transactions} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CategoryChart transactions={transactions} type="expense" />
              <CategoryChart transactions={transactions} type="income" />
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-1">
            <TransactionList 
              transactions={filteredTransactions.slice(0, 15)} 
              onDelete={handleDeleteTransaction}
            />
          </div>
        </div>
      </main>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <TransactionModal 
          onClose={() => setShowTransactionModal(false)}
          onSave={handleAddTransaction}
        />
      )}

      {/* AI Assistant Panel */}
      {showAIAssistant && (
        <AIAssistant 
          transactions={transactions}
          onClose={() => setShowAIAssistant(false)}
        />
      )}
    </div>
  )
}
