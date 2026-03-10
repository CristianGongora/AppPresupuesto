'use client'

import { useState } from 'react'
import type { Transaction } from '@/app/protected/page'

interface TransactionModalProps {
  onClose: () => void
  onSave: (transaction: Omit<Transaction, 'id' | 'created_at'>) => void
}

const EXPENSE_CATEGORIES = [
  'Alimentación', 'Transporte', 'Vivienda', 'Entretenimiento', 
  'Salud', 'Educación', 'Ropa', 'Servicios', 'Otros'
]

const INCOME_CATEGORIES = [
  'Salario', 'Freelance', 'Inversiones', 'Ventas', 
  'Regalos', 'Reembolsos', 'Otros'
]

export function TransactionModal({ onClose, onSave }: TransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description || !category) return

    setSaving(true)
    await onSave({
      type,
      amount: parseFloat(amount),
      description,
      category,
      date,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md glass rounded-2xl p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Nueva transacción</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type Toggle */}
          <div className="flex bg-secondary rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategory(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                type === 'expense' 
                  ? 'bg-expense text-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategory(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                type === 'income' 
                  ? 'bg-income text-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ingreso
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Monto
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Compra en supermercado"
              className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              required
            >
              <option value="">Selecciona una categoría</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3 rounded-lg font-medium transition-all ${
              type === 'income'
                ? 'bg-income hover:bg-income/90 text-white'
                : 'bg-expense hover:bg-expense/90 text-white'
            } disabled:opacity-50`}
          >
            {saving ? 'Guardando...' : 'Guardar transacción'}
          </button>
        </form>
      </div>
    </div>
  )
}
