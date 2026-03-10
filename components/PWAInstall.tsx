'use client'

import { useState, useEffect } from 'react'
import { X, Download, Share, Plus } from 'lucide-react'
import { useLanguage } from './LanguageProvider'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true
    setIsStandalone(standalone)
    
    if (standalone) return

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)

    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    const dismissedTime = dismissed ? parseInt(dismissed) : 0
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
    
    // Show again after 7 days
    if (daysSinceDismissed < 7) return

    // For iOS, show instructions after a delay
    if (ios) {
      const timer = setTimeout(() => setShowInstallBanner(true), 3000)
      return () => clearTimeout(timer)
    }

    // For other browsers, listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope)
        })
        .catch((error) => {
          console.log('SW registration failed:', error)
        })
    }
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }

    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowInstallBanner(false)
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowInstallBanner(false)
    setShowIOSInstructions(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isStandalone || !showInstallBanner) return null

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border border-border rounded-2xl shadow-xl p-4 z-50 animate-in slide-in-from-bottom-5">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-7 h-7 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground mb-1">
              {t('pwa.installTitle')}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {t('pwa.installDescription')}
            </p>
            
            <button
              onClick={handleInstall}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isIOS ? (
                <>
                  <Share className="w-4 h-4" />
                  {t('pwa.howToInstall')}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {t('pwa.install')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                {t('pwa.iosInstructionsTitle')}
              </h3>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold">1</span>
                </div>
                <div>
                  <p className="text-foreground">
                    {t('pwa.iosStep1')}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg">
                    <Share className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold">2</span>
                </div>
                <div>
                  <p className="text-foreground">
                    {t('pwa.iosStep2')}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">{t('pwa.addToHomeScreen')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold">3</span>
                </div>
                <p className="text-foreground">
                  {t('pwa.iosStep3')}
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              {t('pwa.understood')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
