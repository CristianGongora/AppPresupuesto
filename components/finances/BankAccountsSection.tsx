'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface BankAccount {
  id: string
  name: string
  bank_name: string
  account_type: 'checking' | 'savings' | 'credit_card'
  account_number: string | null
  current_balance: number
  currency: string
  color: string
  is_active: boolean
}

interface BankAccountsSectionProps {
  userId: string
  onRefresh: () => void
}

const ACCOUNT_TYPES = {
  checking: 'Cuenta Corriente',
  savings: 'Cuenta de Ahorros',
  credit_card: 'Tarjeta de Credito',
}

const BANKS = [
  'Bancolombia', 'Banco de Bogota', 'Davivienda', 'BBVA', 'Banco de Occidente',
  'Banco Popular', 'Banco Caja Social', 'Banco Falabella', 'Nequi', 'Daviplata',
  'Nu Bank', 'Banco Agrario', 'Scotiabank', 'Citibank', 'Otro'
]

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

export function BankAccountsSection({ userId, onRefresh }: BankAccountsSectionProps) {
  const supabase = createClient()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    bank_name: '',
    account_type: 'savings' as 'checking' | 'savings' | 'credit_card',
    account_number: '',
    current_balance: '',
    currency: 'COP',
    color: COLORS[0],
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [userId])

  async function loadAccounts() {
    const { data } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    setAccounts(data || [])
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      bank_name: '',
      account_type: 'savings',
      account_number: '',
      current_balance: '',
      currency: 'COP',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    })
    setEditingAccount(null)
  }

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      bank_name: account.bank_name,
      account_type: account.account_type,
      account_number: account.account_number || '',
      current_balance: account.current_balance.toString(),
      currency: account.currency,
      color: account.color,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const accountData = {
      user_id: userId,
      name: formData.name,
      bank_name: formData.bank_name,
      account_type: formData.account_type,
      account_number: formData.account_number || null,
      current_balance: parseFloat(formData.current_balance) || 0,
      currency: formData.currency,
      color: formData.color,
    }

    if (editingAccount) {
      await supabase
        .from('bank_accounts')
        .update({ ...accountData, updated_at: new Date().toISOString() })
        .eq('id', editingAccount.id)
    } else {
      await supabase.from('bank_accounts').insert([accountData])
    }

    await loadAccounts()
    onRefresh()
    setShowModal(false)
    resetForm()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Esta seguro de eliminar esta cuenta?')) return
    
    await supabase
      .from('bank_accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    await loadAccounts()
    onRefresh()
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-6 border border-border animate-pulse">
            <div className="h-6 bg-muted rounded w-32 mb-4" />
            <div className="h-8 bg-muted rounded w-40" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Mis Cuentas</h2>
          <p className="text-sm text-muted-foreground">Administra tus cuentas bancarias</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Cuenta
        </button>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No tienes cuentas registradas</h3>
          <p className="text-muted-foreground mb-4">Agrega tu primera cuenta bancaria para comenzar</p>
          <button
            onClick={() => { resetForm(); setShowModal(true) }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            Agregar Cuenta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-card rounded-xl border border-border p-6 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: account.color + '20' }}
                  >
                    <svg className="w-5 h-5" style={{ color: account.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{account.name}</h3>
                    <p className="text-xs text-muted-foreground">{account.bank_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleEdit(account)}
                    className="p-1.5 rounded hover:bg-muted transition"
                  >
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 transition"
                  >
                    <svg className="w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{ACCOUNT_TYPES[account.account_type]}</span>
                  {account.account_number && (
                    <span className="text-xs text-muted-foreground">****{account.account_number.slice(-4)}</span>
                  )}
                </div>
                <p className={`text-2xl font-bold ${account.current_balance >= 0 ? 'text-income' : 'text-expense'}`}>
                  {formatCurrency(account.current_balance, account.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta Bancaria'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nombre de la cuenta</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: Cuenta Nomina"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Banco</label>
                <select
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Seleccionar banco</option>
                  {BANKS.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tipo de cuenta</label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value as typeof formData.account_type })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  {Object.entries(ACCOUNT_TYPES).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Numero de cuenta (opcional)</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ultimos 4 digitos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Saldo actual</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.current_balance}
                  onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full transition ${formData.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-muted transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editingAccount ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
