'use client'

import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  created_at: string
}

interface TransactionListProps {
  transactions: Transaction[]
  onDelete: (id: string) => void
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar esta transacción?')) {
      setDeleting(id)
      await onDelete(id)
      setDeleting(null)
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="glass rounded-xl p-6 h-full">
        <h3 className="text-lg font-semibold text-foreground mb-4">Transacciones recientes</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-muted-foreground">No hay transacciones aún</p>
          <p className="text-sm text-muted-foreground mt-1">Agrega tu primera transacción</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Transacciones recientes</h3>
        <span className="text-sm text-muted-foreground">{transactions.length} items</span>
      </div>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {transactions.map((transaction, index) => (
          <div 
            key={transaction.id}
            className="group flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              transaction.type === 'income' ? 'bg-income/10' : 'bg-expense/10'
            }`}>
              {transaction.type === 'income' ? (
                <svg className="w-5 h-5 text-income" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-expense" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{transaction.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-0.5 bg-background rounded-full">{transaction.category}</span>
                <span>{formatDate(transaction.date)}</span>
              </div>
            </div>

            {/* Amount & Delete */}
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${
                transaction.type === 'income' ? 'text-income' : 'text-expense'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </span>
              <button
                onClick={() => handleDelete(transaction.id)}
                disabled={deleting === transaction.id}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all disabled:opacity-50"
                title="Eliminar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
