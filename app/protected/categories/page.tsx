'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/components/LanguageProvider'
import { ThemeToggle } from '@/components/ThemeToggle'
import { IconPicker } from '@/components/IconGallery'
import * as LucideIcons from 'lucide-react'

interface Category {
  id: string
  name: string
  type: 'income' | 'expense' | 'both'
  icon: string
  color: string
  is_default: boolean
}

export default function CategoriesPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()
  
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense' | 'both',
    icon: 'Circle',
    color: '#6366f1',
  })

  useEffect(() => {
    checkUserAndLoadCategories()
  }, [])

  const checkUserAndLoadCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    await loadCategories()
    setLoading(false)
  }

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name')
    
    if (!error && data) {
      setCategories(data)
    }
  }

  const openNewCategoryModal = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      type: activeTab,
      icon: 'Circle',
      color: '#6366f1',
    })
    setShowModal(true)
  }

  const openEditModal = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return
    setSaving(true)

    try {
      if (editingCategory) {
        // Update existing
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            type: formData.type,
            icon: formData.icon,
            color: formData.color,
          })
          .eq('id', editingCategory.id)
        
        if (error) throw error
      } else {
        // Create new
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
          .from('categories')
          .insert({
            user_id: user.id,
            name: formData.name,
            type: formData.type,
            icon: formData.icon,
            color: formData.color,
            is_default: false,
          })
        
        if (error) throw error
      }

      await loadCategories()
      setShowModal(false)
    } catch (error) {
      console.error('Error saving category:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category: Category) => {
    if (!confirm(t('categories.deleteConfirm'))) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)
      
      if (error) throw error
      await loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const renderIcon = (iconName: string, color: string) => {
    const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[iconName]
    if (!IconComponent) return <LucideIcons.Circle className="w-5 h-5" style={{ color }} />
    return <IconComponent className="w-5 h-5" style={{ color }} />
  }

  const filteredCategories = categories.filter(cat => 
    cat.type === activeTab || cat.type === 'both'
  )

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/protected"
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <LucideIcons.ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-foreground">
                {t('categories.title')}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-4 py-2 font-medium rounded-lg transition ${
                activeTab === 'expense'
                  ? 'bg-expense text-white'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('categories.expenseCategories')}
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`px-4 py-2 font-medium rounded-lg transition ${
                activeTab === 'income'
                  ? 'bg-income text-white'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('categories.incomeCategories')}
            </button>
          </div>
          <button
            onClick={openNewCategoryModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <LucideIcons.Plus className="w-4 h-4" />
            {t('categories.newCategory')}
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="glass rounded-xl p-4 flex items-center gap-4 group hover:border-primary/50 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${category.color}20` }}
              >
                {renderIcon(category.icon, category.color)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{category.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {category.is_default ? t('categories.defaultCategory') : t('categories.customCategory')}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(category)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  title={t('categories.editCategory')}
                >
                  <LucideIcons.Pencil className="w-4 h-4 text-muted-foreground" />
                </button>
                {!category.is_default && (
                  <button
                    onClick={() => handleDelete(category)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                    title={t('categories.deleteCategory')}
                  >
                    <LucideIcons.Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <LucideIcons.FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('categories.noIconsFound')}</p>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {editingCategory ? t('categories.editCategory') : t('categories.newCategory')}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <LucideIcons.X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('categories.categoryName')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('categories.categoryName')}
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('categories.categoryType')}
                </label>
                <div className="flex gap-2">
                  {(['expense', 'income', 'both'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition ${
                        formData.type === type
                          ? type === 'expense'
                            ? 'bg-expense text-white'
                            : type === 'income'
                            ? 'bg-income text-white'
                            : 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {type === 'expense'
                        ? t('dashboard.expense')
                        : type === 'income'
                        ? t('dashboard.income')
                        : t('categories.bothTypes')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('categories.selectIcon')}
                </label>
                <IconPicker
                  icon={formData.icon}
                  color={formData.color}
                  onChange={(icon, color) => setFormData({ ...formData, icon, color })}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                {t('categories.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name.trim()}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? t('auth.loading') : t('categories.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
