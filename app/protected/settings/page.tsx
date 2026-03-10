'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useTheme } from '@/components/ThemeProvider'

type UserProfile = {
  id: string
  display_name: string | null
  currency: string
  timezone: string
  language: string
}

const CURRENCIES = [
  { code: 'USD', name: 'Dolar estadounidense ($)' },
  { code: 'EUR', name: 'Euro (E)' },
  { code: 'MXN', name: 'Peso mexicano ($)' },
  { code: 'COP', name: 'Peso colombiano ($)' },
  { code: 'ARS', name: 'Peso argentino ($)' },
  { code: 'CLP', name: 'Peso chileno ($)' },
  { code: 'PEN', name: 'Sol peruano (S/)' },
  { code: 'BRL', name: 'Real brasileno (R$)' },
]

const TIMEZONES = [
  { value: 'America/New_York', name: 'Nueva York (EST)' },
  { value: 'America/Chicago', name: 'Chicago (CST)' },
  { value: 'America/Denver', name: 'Denver (MST)' },
  { value: 'America/Los_Angeles', name: 'Los Angeles (PST)' },
  { value: 'America/Mexico_City', name: 'Ciudad de Mexico' },
  { value: 'America/Bogota', name: 'Bogota' },
  { value: 'America/Lima', name: 'Lima' },
  { value: 'America/Santiago', name: 'Santiago' },
  { value: 'America/Buenos_Aires', name: 'Buenos Aires' },
  { value: 'America/Sao_Paulo', name: 'Sao Paulo' },
  { value: 'Europe/Madrid', name: 'Madrid' },
  { value: 'Europe/London', name: 'Londres' },
]

const LANGUAGES = [
  { code: 'es', name: 'Espanol' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Portugues' },
]

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [userEmail, setUserEmail] = useState('')
  
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    display_name: '',
    currency: 'USD',
    timezone: 'America/New_York',
    language: 'es',
  })

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUserEmail(user.email || '')
      
      try {
        const response = await fetch('/api/profile')
        const data = await response.json()
        
        if (response.ok) {
          setProfile(data)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
      
      setLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: profile.display_name,
          currency: profile.currency,
          timezone: profile.timezone,
          language: profile.language,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error desconocido')
      }

      setMessage({ type: 'success', text: 'Preferencias guardadas correctamente' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangingPassword(true)
    setMessage(null)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contrasenas no coinciden' })
      setChangingPassword(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contrasena debe tener al menos 6 caracteres' })
      setChangingPassword(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Contrasena actualizada correctamente' })
      setPasswordData({ newPassword: '', confirmPassword: '' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cambiar la contrasena' })
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/protected" 
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-foreground"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Configuracion</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-income/10 text-income border-income/20' 
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="card-glass rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-secondary/30">
              <h2 className="text-lg font-semibold text-foreground">Apariencia</h2>
              <p className="text-sm text-muted-foreground">Personaliza el tema de la aplicacion</p>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                      theme === t 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border bg-secondary/50 text-foreground hover:bg-secondary'
                    }`}
                  >
                    {t === 'light' && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                    {t === 'dark' && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                    {t === 'system' && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    <span className="font-medium capitalize">
                      {t === 'light' ? 'Claro' : t === 'dark' ? 'Oscuro' : 'Sistema'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Profile Settings */}
          <div className="card-glass rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-secondary/30">
              <h2 className="text-lg font-semibold text-foreground">Perfil</h2>
              <p className="text-sm text-muted-foreground">Informacion basica de tu cuenta</p>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Correo electronico
                </label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombre para mostrar
                </label>
                <input
                  type="text"
                  value={profile.display_name || ''}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder:text-muted-foreground transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Moneda preferida
                  </label>
                  <select
                    value={profile.currency}
                    onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground transition-colors"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Zona horaria
                  </label>
                  <select
                    value={profile.timezone}
                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground transition-colors"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Idioma
                </label>
                <select
                  value={profile.language}
                  onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground transition-colors"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Guardando...' : 'Guardar preferencias'}
                </button>
              </div>
            </form>
          </div>

          {/* Password Change */}
          <div className="card-glass rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-secondary/30">
              <h2 className="text-lg font-semibold text-foreground">Seguridad</h2>
              <p className="text-sm text-muted-foreground">Cambiar tu contrasena</p>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nueva contrasena
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Minimo 6 caracteres"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder:text-muted-foreground transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirmar nueva contrasena
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Repite la contrasena"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder:text-muted-foreground transition-colors"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {changingPassword ? 'Cambiando...' : 'Cambiar contrasena'}
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="card-glass rounded-xl overflow-hidden border-destructive/30">
            <div className="px-6 py-4 border-b border-destructive/20 bg-destructive/5">
              <h2 className="text-lg font-semibold text-destructive">Zona de peligro</h2>
              <p className="text-sm text-destructive/70">Acciones irreversibles</p>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Si deseas eliminar tu cuenta y todos tus datos, contacta al soporte.
              </p>
              <button
                type="button"
                className="px-4 py-2 border border-destructive/30 text-destructive font-medium rounded-lg hover:bg-destructive/10 transition-colors"
                onClick={() => alert('Para eliminar tu cuenta, contacta al soporte tecnico.')}
              >
                Solicitar eliminacion de cuenta
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
