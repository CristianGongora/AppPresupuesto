'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface Credit {
  id: string
  name: string
  lender: string
  credit_type: 'personal' | 'mortgage' | 'vehicle' | 'credit_card' | 'other'
  original_amount: number
  current_balance: number
  interest_rate: number
  monthly_payment: number
  total_installments: number
  paid_installments: number
  start_date: string
  end_date: string
  payment_day: number | null
  currency: string
  is_active: boolean
}

interface CreditsSectionProps {
  userId: string
  onRefresh: () => void
}

const CREDIT_TYPES = {
  personal: 'Prestamo Personal',
  mortgage: 'Hipotecario',
  vehicle: 'Vehiculo',
  credit_card: 'Tarjeta de Credito',
  other: 'Otro',
}

const LENDERS = [
  'Bancolombia', 'Banco de Bogota', 'Davivienda', 'BBVA', 'Banco de Occidente',
  'Banco Popular', 'Banco Caja Social', 'Banco Falabella', 'Banco Agrario',
  'Finandina', 'Tuya', 'Credivalores', 'Otro'
]

export function CreditsSection({ userId, onRefresh }: CreditsSectionProps) {
  const supabase = createClient()
  const [credits, setCredits] = useState<Credit[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    lender: '',
    credit_type: 'personal' as Credit['credit_type'],
    original_amount: '',
    current_balance: '',
    interest_rate: '',
    monthly_payment: '',
    total_installments: '',
    paid_installments: '',
    start_date: '',
    end_date: '',
    payment_day: '',
    currency: 'COP',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCredits()
  }, [userId])

  async function loadCredits() {
    const { data } = await supabase
      .from('credits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('end_date', { ascending: true })

    setCredits(data || [])
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      lender: '',
      credit_type: 'personal',
      original_amount: '',
      current_balance: '',
      interest_rate: '',
      monthly_payment: '',
      total_installments: '',
      paid_installments: '',
      start_date: '',
      end_date: '',
      payment_day: '',
      currency: 'COP',
    })
    setEditingCredit(null)
  }

  const handleEdit = (credit: Credit) => {
    setEditingCredit(credit)
    setFormData({
      name: credit.name,
      lender: credit.lender,
      credit_type: credit.credit_type,
      original_amount: credit.original_amount.toString(),
      current_balance: credit.current_balance.toString(),
      interest_rate: credit.interest_rate.toString(),
      monthly_payment: credit.monthly_payment.toString(),
      total_installments: credit.total_installments.toString(),
      paid_installments: credit.paid_installments.toString(),
      start_date: credit.start_date,
      end_date: credit.end_date,
      payment_day: credit.payment_day?.toString() || '',
      currency: credit.currency,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const creditData = {
      user_id: userId,
      name: formData.name,
      lender: formData.lender,
      credit_type: formData.credit_type,
      original_amount: parseFloat(formData.original_amount),
      current_balance: parseFloat(formData.current_balance),
      interest_rate: parseFloat(formData.interest_rate),
      monthly_payment: parseFloat(formData.monthly_payment),
      total_installments: parseInt(formData.total_installments),
      paid_installments: parseInt(formData.paid_installments) || 0,
      start_date: formData.start_date,
      end_date: formData.end_date,
      payment_day: formData.payment_day ? parseInt(formData.payment_day) : null,
      currency: formData.currency,
    }

    if (editingCredit) {
      await supabase
        .from('credits')
        .update({ ...creditData, updated_at: new Date().toISOString() })
        .eq('id', editingCredit.id)
    } else {
      await supabase.from('credits').insert([creditData])
    }

    await loadCredits()
    onRefresh()
    setShowModal(false)
    resetForm()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Esta seguro de eliminar este credito?')) return
    
    await supabase
      .from('credits')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    await loadCredits()
    onRefresh()
  }

  const getProgress = (credit: Credit) => {
    return Math.round((credit.paid_installments / credit.total_installments) * 100)
  }

  const getDaysUntilPayment = (paymentDay: number | null) => {
    if (!paymentDay) return null
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    let nextPayment = new Date(currentYear, currentMonth, paymentDay)
    if (nextPayment <= today) {
      nextPayment = new Date(currentYear, currentMonth + 1, paymentDay)
    }
    const diffTime = nextPayment.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-6 border border-border animate-pulse">
            <div className="h-6 bg-muted rounded w-48 mb-4" />
            <div className="h-4 bg-muted rounded w-full" />
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
          <h2 className="text-xl font-semibold text-foreground">Mis Creditos</h2>
          <p className="text-sm text-muted-foreground">Gestiona tus prestamos y deudas</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Credito
        </button>
      </div>

      {/* Credits List */}
      {credits.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No tienes creditos registrados</h3>
          <p className="text-muted-foreground mb-4">Agrega tus creditos para llevar un control de tus deudas</p>
          <button
            onClick={() => { resetForm(); setShowModal(true) }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            Agregar Credito
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {credits.map((credit) => {
            const progress = getProgress(credit)
            const daysUntilPayment = getDaysUntilPayment(credit.payment_day)
            
            return (
              <div
                key={credit.id}
                className="bg-card rounded-xl border border-border p-6 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{credit.name}</h3>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                        {CREDIT_TYPES[credit.credit_type]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{credit.lender}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleEdit(credit)} className="p-1.5 rounded hover:bg-muted transition">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(credit.id)} className="p-1.5 rounded hover:bg-destructive/10 transition">
                      <svg className="w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                    <p className="text-lg font-semibold text-expense">{formatCurrency(credit.current_balance, credit.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cuota mensual</p>
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(credit.monthly_payment, credit.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tasa de interes</p>
                    <p className="text-lg font-semibold text-foreground">{credit.interest_rate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cuotas</p>
                    <p className="text-lg font-semibold text-foreground">{credit.paid_installments}/{credit.total_installments}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="text-foreground font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {daysUntilPayment !== null && (
                    <p className={`text-xs ${daysUntilPayment <= 5 ? 'text-expense' : 'text-muted-foreground'}`}>
                      Proximo pago en {daysUntilPayment} dias (dia {credit.payment_day})
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {editingCredit ? 'Editar Credito' : 'Nuevo Credito'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">Nombre</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: Credito de Vivienda"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Entidad</label>
                  <select
                    value={formData.lender}
                    onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {LENDERS.map((lender) => (
                      <option key={lender} value={lender}>{lender}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                  <select
                    value={formData.credit_type}
                    onChange={(e) => setFormData({ ...formData, credit_type: e.target.value as Credit['credit_type'] })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {Object.entries(CREDIT_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Monto original</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.original_amount}
                    onChange={(e) => setFormData({ ...formData, original_amount: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
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
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Tasa interes (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Cuota mensual</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthly_payment}
                    onChange={(e) => setFormData({ ...formData, monthly_payment: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Total cuotas</label>
                  <input
                    type="number"
                    value={formData.total_installments}
                    onChange={(e) => setFormData({ ...formData, total_installments: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Cuotas pagadas</label>
                  <input
                    type="number"
                    value={formData.paid_installments}
                    onChange={(e) => setFormData({ ...formData, paid_installments: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Fecha inicio</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Fecha fin</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Dia de pago</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.payment_day}
                    onChange={(e) => setFormData({ ...formData, payment_day: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="1-31"
                  />
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
                  {saving ? 'Guardando...' : editingCredit ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
