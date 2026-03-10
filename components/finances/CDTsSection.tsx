'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface CDT {
  id: string
  name: string
  bank_name: string
  initial_amount: number
  interest_rate: number
  term_days: number
  start_date: string
  maturity_date: string
  expected_return: number
  auto_renewal: boolean
  currency: string
  status: 'active' | 'matured' | 'renewed' | 'cancelled'
}

interface CDTsSectionProps {
  userId: string
  onRefresh: () => void
}

const BANKS = [
  'Bancolombia', 'Banco de Bogota', 'Davivienda', 'BBVA', 'Banco de Occidente',
  'Banco Popular', 'Banco Caja Social', 'Banco Falabella', 'Banco Agrario',
  'Finandina', 'Coltefinanciera', 'RappiPay', 'Otro'
]

const TERMS = [
  { days: 30, label: '30 dias' },
  { days: 60, label: '60 dias' },
  { days: 90, label: '90 dias' },
  { days: 180, label: '180 dias' },
  { days: 360, label: '360 dias' },
  { days: 540, label: '540 dias' },
]

const STATUS_LABELS = {
  active: { label: 'Activo', color: 'bg-income/20 text-income' },
  matured: { label: 'Vencido', color: 'bg-amber-500/20 text-amber-500' },
  renewed: { label: 'Renovado', color: 'bg-blue-500/20 text-blue-500' },
  cancelled: { label: 'Cancelado', color: 'bg-muted text-muted-foreground' },
}

export function CDTsSection({ userId, onRefresh }: CDTsSectionProps) {
  const supabase = createClient()
  const [cdts, setCdts] = useState<CDT[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCDT, setEditingCDT] = useState<CDT | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    bank_name: '',
    initial_amount: '',
    interest_rate: '',
    term_days: '90',
    start_date: new Date().toISOString().split('T')[0],
    auto_renewal: false,
    currency: 'COP',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCDTs()
  }, [userId])

  async function loadCDTs() {
    const { data } = await supabase
      .from('cdts')
      .select('*')
      .eq('user_id', userId)
      .order('maturity_date', { ascending: true })

    setCdts(data || [])
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      bank_name: '',
      initial_amount: '',
      interest_rate: '',
      term_days: '90',
      start_date: new Date().toISOString().split('T')[0],
      auto_renewal: false,
      currency: 'COP',
    })
    setEditingCDT(null)
  }

  const calculateExpectedReturn = (amount: number, rate: number, days: number) => {
    return amount * (rate / 100) * (days / 365)
  }

  const calculateMaturityDate = (startDate: string, days: number) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  const handleEdit = (cdt: CDT) => {
    setEditingCDT(cdt)
    setFormData({
      name: cdt.name,
      bank_name: cdt.bank_name,
      initial_amount: cdt.initial_amount.toString(),
      interest_rate: cdt.interest_rate.toString(),
      term_days: cdt.term_days.toString(),
      start_date: cdt.start_date,
      auto_renewal: cdt.auto_renewal,
      currency: cdt.currency,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const amount = parseFloat(formData.initial_amount)
    const rate = parseFloat(formData.interest_rate)
    const days = parseInt(formData.term_days)

    const cdtData = {
      user_id: userId,
      name: formData.name,
      bank_name: formData.bank_name,
      initial_amount: amount,
      interest_rate: rate,
      term_days: days,
      start_date: formData.start_date,
      maturity_date: calculateMaturityDate(formData.start_date, days),
      expected_return: calculateExpectedReturn(amount, rate, days),
      auto_renewal: formData.auto_renewal,
      currency: formData.currency,
      status: 'active' as const,
    }

    if (editingCDT) {
      await supabase
        .from('cdts')
        .update({ ...cdtData, updated_at: new Date().toISOString() })
        .eq('id', editingCDT.id)
    } else {
      await supabase.from('cdts').insert([cdtData])
    }

    await loadCDTs()
    onRefresh()
    setShowModal(false)
    resetForm()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Esta seguro de eliminar este CDT?')) return
    
    await supabase
      .from('cdts')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)

    await loadCDTs()
    onRefresh()
  }

  const getDaysUntilMaturity = (maturityDate: string) => {
    const today = new Date()
    const maturity = new Date(maturityDate)
    const diffTime = maturity.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-6 border border-border animate-pulse">
            <div className="h-6 bg-muted rounded w-48 mb-4" />
            <div className="h-8 bg-muted rounded w-32" />
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
          <h2 className="text-xl font-semibold text-foreground">Mis CDTs</h2>
          <p className="text-sm text-muted-foreground">Certificados de Deposito a Termino</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar CDT
        </button>
      </div>

      {/* CDTs List */}
      {cdts.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No tienes CDTs registrados</h3>
          <p className="text-muted-foreground mb-4">Los CDTs son una excelente opcion de inversion a bajo riesgo</p>
          <button
            onClick={() => { resetForm(); setShowModal(true) }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            Agregar CDT
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cdts.map((cdt) => {
            const daysUntilMaturity = getDaysUntilMaturity(cdt.maturity_date)
            const isNearMaturity = daysUntilMaturity <= 30 && daysUntilMaturity > 0
            const isMatured = daysUntilMaturity <= 0
            const statusInfo = STATUS_LABELS[cdt.status]
            
            return (
              <div
                key={cdt.id}
                className={`bg-card rounded-xl border p-6 hover:border-primary/30 transition-all group ${
                  isNearMaturity ? 'border-amber-500/50' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{cdt.name}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{cdt.bank_name}</p>
                  </div>
                  {cdt.status === 'active' && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => handleEdit(cdt)} className="p-1.5 rounded hover:bg-muted transition">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(cdt.id)} className="p-1.5 rounded hover:bg-destructive/10 transition">
                        <svg className="w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Capital invertido</p>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(cdt.initial_amount, cdt.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rendimiento esperado</p>
                    <p className="text-xl font-bold text-income">+{formatCurrency(cdt.expected_return, cdt.currency)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm border-t border-border pt-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-muted-foreground">Tasa: </span>
                      <span className="text-foreground font-medium">{cdt.interest_rate}% EA</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Plazo: </span>
                      <span className="text-foreground font-medium">{cdt.term_days} dias</span>
                    </div>
                  </div>
                  {cdt.auto_renewal && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Auto-renovacion
                    </span>
                  )}
                </div>

                <div className={`mt-3 text-sm ${isMatured ? 'text-amber-500' : isNearMaturity ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {isMatured ? (
                    <span className="font-medium">Vencido - Retirar o renovar</span>
                  ) : (
                    <span>Vence el {new Date(cdt.maturity_date).toLocaleDateString('es-CO')} ({daysUntilMaturity} dias)</span>
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
          <div className="bg-card rounded-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {editingCDT ? 'Editar CDT' : 'Nuevo CDT'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: CDT Ahorro 2024"
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
                <label className="block text-sm font-medium text-foreground mb-2">Monto a invertir</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.initial_amount}
                  onChange={(e) => setFormData({ ...formData, initial_amount: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tasa de interes (% EA)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: 12.5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Plazo</label>
                <select
                  value={formData.term_days}
                  onChange={(e) => setFormData({ ...formData, term_days: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  {TERMS.map((term) => (
                    <option key={term.days} value={term.days}>{term.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Fecha de apertura</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.auto_renewal}
                  onChange={(e) => setFormData({ ...formData, auto_renewal: e.target.checked })}
                  className="w-5 h-5 rounded border-border"
                />
                <span className="text-sm text-foreground">Renovacion automatica al vencimiento</span>
              </label>

              {formData.initial_amount && formData.interest_rate && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Rendimiento estimado:</p>
                  <p className="text-lg font-bold text-income">
                    +{formatCurrency(
                      calculateExpectedReturn(
                        parseFloat(formData.initial_amount) || 0,
                        parseFloat(formData.interest_rate) || 0,
                        parseInt(formData.term_days)
                      ),
                      formData.currency
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vencimiento: {calculateMaturityDate(formData.start_date, parseInt(formData.term_days))}
                  </p>
                </div>
              )}

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
                  {saving ? 'Guardando...' : editingCDT ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
