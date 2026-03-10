import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'COP'): string {
  const localeMap: Record<string, string> = {
    COP: 'es-CO',
    MXN: 'es-MX',
    USD: 'en-US',
    EUR: 'es-ES',
    ARS: 'es-AR',
    CLP: 'es-CL',
    PEN: 'es-PE',
    BRL: 'pt-BR',
  }
  
  return new Intl.NumberFormat(localeMap[currency] || 'es-CO', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export const CATEGORIES = {
  food: { label: 'Comida / Restaurante', icon: 'UtensilsCrossed' },
  transport: { label: 'Transporte / Gasolina', icon: 'Car' },
  utilities: { label: 'Servicios (Luz, Agua)', icon: 'Zap' },
  entertainment: { label: 'Entretenimiento', icon: 'Gamepad2' },
  shopping: { label: 'Compras / Ropa', icon: 'ShoppingBag' },
  health: { label: 'Salud / Farmacia', icon: 'Heart' },
  salary: { label: 'Salario / Nómina', icon: 'Banknote' },
  other: { label: 'Otro', icon: 'MoreHorizontal' },
} as const

export type CategoryKey = keyof typeof CATEGORIES

export interface Transaction {
  id: string
  user_id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  created_at: string
}
