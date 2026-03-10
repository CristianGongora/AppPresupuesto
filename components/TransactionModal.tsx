'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from './LanguageProvider'
import { VoiceInput } from './VoiceInput'
import { createClient } from '@/lib/supabase/client'
import * as LucideIcons from 'lucide-react'
import type { Transaction } from '@/lib/utils'

interface Category {
  id: string
  name: string
  type: 'income' | 'expense' | 'both'
  icon: string
  color: string
}

interface TransactionModalProps {
  onClose: () => void
  onSave: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => void
}

export function TransactionModal({ onClose, onSave }: TransactionModalProps) {
  const { t, language } = useLanguage()
  const supabase = createClient()
  
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [processingVoice, setProcessingVoice] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)

  // Load categories from database
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (!error && data) {
      setCategories(data)
    }
    setLoadingCategories(false)
  }

  const filteredCategories = categories.filter(
    cat => cat.type === type || cat.type === 'both'
  )

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

  const handleVoiceTranscript = async (text: string) => {
    setProcessingVoice(true)
    
    try {
      const response = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language,
          categories: categories.map(c => `${c.name} (${c.type})`),
        }),
      })

      const data = await response.json()

      if (data.success && data.transaction) {
        const { amount: extractedAmount, type: extractedType, description: extractedDesc, suggestedCategory } = data.transaction
        
        setAmount(extractedAmount.toString())
        setType(extractedType)
        setDescription(extractedDesc)
        
        // Find matching category
        const matchingCategory = categories.find(
          c => c.name.toLowerCase() === suggestedCategory.toLowerCase() ||
               c.name.toLowerCase().includes(suggestedCategory.toLowerCase())
        )
        if (matchingCategory) {
          setCategory(matchingCategory.name)
        } else {
          setCategory(suggestedCategory)
        }
        
        setVoiceMode(false)
      }
    } catch (error) {
      console.error('Error processing voice:', error)
    } finally {
      setProcessingVoice(false)
    }
  }

  const renderCategoryIcon = (iconName: string, color: string) => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>
    const IconComponent = icons[iconName]
    if (!IconComponent) return <LucideIcons.Circle className="w-4 h-4" style={{ color }} />
    return <IconComponent className="w-4 h-4" style={{ color }} />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md glass rounded-2xl p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">{t('transactions.newTransaction')}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVoiceMode(!voiceMode)}
              className={`p-2 rounded-lg transition-colors ${
                voiceMode ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`}
              title={t('voice.voiceInput')}
            >
              <LucideIcons.Mic className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <LucideIcons.X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voice Input Mode */}
        {voiceMode && (
          <div className="mb-6 p-6 bg-secondary/50 rounded-xl">
            <p className="text-sm text-muted-foreground text-center mb-4">
              {t('voice.speakNow')}
            </p>
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              onProcessing={setProcessingVoice}
              disabled={processingVoice}
            />
            {processingVoice && (
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-primary">
                <LucideIcons.Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('voice.processing')}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center mt-4">
              Ej: "Gasté 50 mil pesos en comida" o "Recibí mi salario de 2 millones"
            </p>
          </div>
        )}

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
              {t('dashboard.expense')}
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
              {t('dashboard.income')}
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('transactions.amount')}
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
              {t('transactions.description')}
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

          {/* Category with Icons */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('transactions.category')}
            </label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                <LucideIcons.Loader2 className="w-4 h-4 animate-spin" />
                {t('auth.loading')}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all ${
                      category === cat.name
                        ? 'bg-primary/10 ring-2 ring-primary'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      {renderCategoryIcon(cat.icon, cat.color)}
                    </div>
                    <span className="text-xs font-medium text-foreground truncate w-full text-center">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {filteredCategories.length === 0 && !loadingCategories && (
              <p className="text-sm text-muted-foreground py-2">
                No hay categorías disponibles
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('transactions.date')}
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
            disabled={saving || !amount || !description || !category}
            className={`w-full py-3 rounded-lg font-medium transition-all ${
              type === 'income'
                ? 'bg-income hover:bg-income/90 text-white'
                : 'bg-expense hover:bg-expense/90 text-white'
            } disabled:opacity-50`}
          >
            {saving ? t('transactions.saving') : t('transactions.save')}
          </button>
        </form>
      </div>
    </div>
  )
}
