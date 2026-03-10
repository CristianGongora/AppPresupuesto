'use client'

import { useState, useMemo } from 'react'
import { useLanguage } from './LanguageProvider'
import * as LucideIcons from 'lucide-react'

// Curated list of icons organized by category
const ICON_CATEGORIES = {
  money: ['Wallet', 'CreditCard', 'Banknote', 'PiggyBank', 'Coins', 'DollarSign', 'Receipt', 'Calculator'],
  food: ['Utensils', 'Coffee', 'Pizza', 'Apple', 'Beef', 'Cookie', 'IceCream', 'Wine', 'Beer', 'Salad'],
  transport: ['Car', 'Bus', 'Train', 'Plane', 'Bike', 'Ship', 'Fuel', 'ParkingCircle', 'CarTaxiFront'],
  home: ['Home', 'Building', 'Building2', 'Warehouse', 'Hotel', 'Bed', 'Sofa', 'Lamp', 'Key'],
  health: ['Heart', 'HeartPulse', 'Stethoscope', 'Pill', 'Syringe', 'Activity', 'Thermometer', 'Hospital'],
  education: ['GraduationCap', 'Book', 'BookOpen', 'Library', 'Notebook', 'Pencil', 'School', 'Languages'],
  entertainment: ['Gamepad2', 'Music', 'Film', 'Tv', 'Headphones', 'Camera', 'Ticket', 'Theater', 'Clapperboard'],
  shopping: ['ShoppingCart', 'ShoppingBag', 'Store', 'Package', 'Gift', 'Tag', 'Shirt', 'Watch'],
  work: ['Briefcase', 'Laptop', 'Monitor', 'Smartphone', 'Printer', 'FileText', 'FolderOpen', 'ClipboardList'],
  services: ['Zap', 'Wifi', 'Phone', 'Mail', 'Globe', 'Cloud', 'Shield', 'Settings', 'Wrench'],
  travel: ['MapPin', 'Map', 'Compass', 'Luggage', 'Tent', 'Mountain', 'Palmtree', 'Anchor', 'Umbrella'],
  fitness: ['Dumbbell', 'Footprints', 'Bike', 'Timer', 'Trophy', 'Medal', 'Target', 'Flame'],
  nature: ['Leaf', 'TreePine', 'Flower2', 'Sun', 'Moon', 'Star', 'Snowflake', 'Droplets'],
  misc: ['MoreHorizontal', 'Circle', 'Square', 'Triangle', 'Bookmark', 'Flag', 'Bell', 'Clock', 'Calendar', 'TrendingUp', 'TrendingDown', 'RotateCcw', 'RefreshCw', 'Sparkles']
}

// Flatten all icons for search
const ALL_ICONS = Object.values(ICON_CATEGORIES).flat()

// Preset colors
const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#64748b', '#78716c', '#0f172a'
]

interface IconGalleryProps {
  selectedIcon: string
  selectedColor: string
  onSelectIcon: (icon: string) => void
  onSelectColor: (color: string) => void
  onClose: () => void
}

export function IconGallery({ selectedIcon, selectedColor, onSelectIcon, onSelectColor, onClose }: IconGalleryProps) {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const categoryLabels: Record<string, string> = {
    money: t('categories.iconCategories.money'),
    food: t('categories.iconCategories.food'),
    transport: t('categories.iconCategories.transport'),
    home: t('categories.iconCategories.home'),
    health: t('categories.iconCategories.health'),
    education: t('categories.iconCategories.education'),
    entertainment: t('categories.iconCategories.entertainment'),
    shopping: t('categories.iconCategories.shopping'),
    work: t('categories.iconCategories.work'),
    services: t('categories.iconCategories.services'),
    travel: t('categories.iconCategories.travel'),
    fitness: t('categories.iconCategories.fitness'),
    nature: t('categories.iconCategories.nature'),
    misc: t('categories.iconCategories.misc'),
  }

  const filteredIcons = useMemo(() => {
    if (searchTerm) {
      return ALL_ICONS.filter(icon => 
        icon.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (activeCategory) {
      return ICON_CATEGORIES[activeCategory as keyof typeof ICON_CATEGORIES] || []
    }
    return ALL_ICONS
  }, [searchTerm, activeCategory])

  const renderIcon = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
    const IconComponent = icons[iconName]
    if (!IconComponent) return null
    return <IconComponent className="w-5 h-5" />
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{t('categories.selectIcon')}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <LucideIcons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setActiveCategory(null)
              }}
              placeholder={t('categories.searchIcons')}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        {/* Color Picker */}
        <div className="p-4 border-b border-border">
          <p className="text-sm font-medium text-foreground mb-3">{t('categories.selectColor')}</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onSelectColor(color)}
                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                  selectedColor === color ? 'ring-2 ring-offset-2 ring-primary ring-offset-background' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        {!searchTerm && (
          <div className="p-4 border-b border-border overflow-x-auto">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  !activeCategory
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('dashboard.allTransactions')}
              </button>
              {Object.keys(ICON_CATEGORIES).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                    activeCategory === category
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {categoryLabels[category] || category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
            {filteredIcons.map((iconName) => (
              <button
                key={iconName}
                onClick={() => onSelectIcon(iconName)}
                className={`p-3 rounded-lg transition-all hover:bg-secondary flex items-center justify-center ${
                  selectedIcon === iconName
                    ? 'bg-primary/10 ring-2 ring-primary'
                    : ''
                }`}
                style={{ color: selectedIcon === iconName ? selectedColor : undefined }}
                title={iconName}
              >
                {renderIcon(iconName)}
              </button>
            ))}
          </div>
          {filteredIcons.length === 0 && (
            <p className="text-center text-muted-foreground py-8">{t('categories.noIconsFound')}</p>
          )}
        </div>

        {/* Footer with Preview */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${selectedColor}20`, color: selectedColor }}
            >
              {renderIcon(selectedIcon)}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{selectedIcon}</p>
              <p className="text-xs text-muted-foreground">{selectedColor}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            {t('categories.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

// Simple icon picker button component
interface IconPickerProps {
  icon: string
  color: string
  onChange: (icon: string, color: string) => void
}

export function IconPicker({ icon, color, onChange }: IconPickerProps) {
  const [showGallery, setShowGallery] = useState(false)
  const { t } = useLanguage()

  const renderIcon = () => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
    const IconComponent = icons[icon]
    if (!IconComponent) return <LucideIcons.Circle className="w-5 h-5" />
    return <IconComponent className="w-5 h-5" />
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGallery(true)}
        className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-lg hover:bg-secondary transition-colors w-full"
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          {renderIcon()}
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-medium text-foreground">{icon}</p>
          <p className="text-xs text-muted-foreground">{t('categories.clickToChange')}</p>
        </div>
        <LucideIcons.ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>

      {showGallery && (
        <IconGallery
          selectedIcon={icon}
          selectedColor={color}
          onSelectIcon={(newIcon) => onChange(newIcon, color)}
          onSelectColor={(newColor) => onChange(icon, newColor)}
          onClose={() => setShowGallery(false)}
        />
      )}
    </>
  )
}
