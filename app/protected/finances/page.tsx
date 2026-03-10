'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useLanguage } from '@/components/LanguageProvider'
import { BankAccountsSection } from '@/components/finances/BankAccountsSection'
import { CreditsSection } from '@/components/finances/CreditsSection'
import { CDTsSection } from '@/components/finances/CDTsSection'
import { FinancialSummary } from '@/components/finances/FinancialSummary'

type Tab = 'accounts' | 'credits' | 'cdts'

export default function FinancesPage() {
  const supabase = createClient()
  const router = useRouter()
  const { t } = useLanguage()
  const [user, setUser] = useState<{ id: string; displayName: string } | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('accounts')
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      const displayName = authUser.user_metadata?.display_name || 
                          authUser.email?.split('@')[0] || 
                          'Usuario'

      setUser({ id: authUser.id, displayName })
      setLoading(false)
    }

    loadUser()
  }, [supabase, router])

  const handleRefresh = () => setRefreshKey(prev => prev + 1)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">{t('auth.loading')}</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'accounts' as Tab, label: 'Cuentas Bancarias', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )},
    { id: 'credits' as Tab, label: 'Créditos', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { id: 'cdts' as Tab, label: 'CDTs', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )},
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/protected" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-bold text-foreground">Productos Financieros</h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/protected/settings"
                className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Financial Summary */}
        {user && <FinancialSummary userId={user.id} refreshKey={refreshKey} />}

        {/* Tabs */}
        <div className="mt-8 border-b border-border">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-4 py-2 font-medium rounded-lg transition ${activeTab === 'accounts' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('finances.bankAccounts')}
            </button>
            <button
              onClick={() => setActiveTab('credits')}
              className={`px-4 py-2 font-medium rounded-lg transition ${activeTab === 'credits' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('finances.credits')}
            </button>
            <button
              onClick={() => setActiveTab('cdts')}
              className={`px-4 py-2 font-medium rounded-lg transition ${activeTab === 'cdts' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('finances.cdts')}
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="mt-6">
          {user && activeTab === 'accounts' && (
            <BankAccountsSection userId={user.id} onRefresh={handleRefresh} />
          )}
          {user && activeTab === 'credits' && (
            <CreditsSection userId={user.id} onRefresh={handleRefresh} />
          )}
          {user && activeTab === 'cdts' && (
            <CDTsSection userId={user.id} onRefresh={handleRefresh} />
          )}
        </div>
      </main>
    </div>
  )
}
