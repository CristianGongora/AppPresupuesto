'use client'

import { useState } from 'react'
import { useLanguage } from './LanguageProvider'

export interface FilterState {
  type: 'all' | 'income' | 'expense'
  category: string
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
  searchTerm: string
}

interface TransactionFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  categories: string[]
}

export function TransactionFilters({ filters, onFiltersChange, categories }: TransactionFiltersProps) {
  const { t } = useLanguage()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const INCOME_CATEGORIES = t('transactions.incomeCategories').split(', ')
  const EXPENSE_CATEGORIES = t('transactions.expenseCategories').split(', ')
  const allCategories = [...new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES, ...categories])]

  const handleChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      type: 'all',
      category: '',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
      searchTerm: '',
    })
  }

  const hasActiveFilters = filters.type !== 'all' || 
    filters.category || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.amountMin || 
    filters.amountMax ||
    filters.searchTerm

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      {/* Search and quick filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => handleChange('searchTerm', e.target.value)}
            placeholder={t('filters.search')}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filters.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="all">{t('dashboard.allTransactions')}</option>
            <option value="income">{t('filters.incomes')}</option>
            <option value="expense">{t('filters.expenses')}</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">{t('dashboard.allCategories')}</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2.5 border rounded-lg transition text-sm flex items-center gap-2 ${
              showAdvanced || hasActiveFilters ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="hidden sm:inline">Filtros</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t('filters.from')}</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t('filters.to')}</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t('filters.minAmount')}</label>
              <input
                type="number"
                value={filters.amountMin}
                onChange={(e) => handleChange('amountMin', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t('filters.maxAmount')}</label>
              <input
                type="number"
                value={filters.amountMax}
                onChange={(e) => handleChange('amountMax', e.target.value)}
                placeholder={t('filters.noLimit')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('filters.clear')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
