'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from './LanguageProvider'
import { Mic, MicOff, Loader2 } from 'lucide-react'

// Web Speech API types
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onProcessing?: (isProcessing: boolean) => void
  disabled?: boolean
  className?: string
}

export function VoiceInput({ onTranscript, onProcessing, disabled = false, className = '' }: VoiceInputProps) {
  const { t, language } = useLanguage()
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Check if Web Speech API is supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      setIsSupported(!!SpeechRecognition)
    }
  }, [])

  const getLanguageCode = useCallback(() => {
    switch (language) {
      case 'es': return 'es-ES'
      case 'en': return 'en-US'
      case 'pt': return 'pt-BR'
      default: return 'es-ES'
    }
  }, [language])

  const startListening = useCallback(() => {
    if (!isSupported || disabled) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = getLanguageCode()

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
      setTranscript('')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      setTranscript(finalTranscript || interimTranscript)

      if (finalTranscript) {
        onTranscript(finalTranscript)
        onProcessing?.(true)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      setError(event.error === 'no-speech' ? t('voice.noSpeechDetected') : t('voice.errorOccurred'))
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    try {
      recognition.start()
    } catch (err) {
      console.error('Failed to start recognition:', err)
      setError(t('voice.errorOccurred'))
    }
  }, [isSupported, disabled, getLanguageCode, onTranscript, onProcessing, t])

  const stopListening = useCallback(() => {
    setIsListening(false)
  }, [])

  if (!isSupported) {
    return null // Don't render if not supported
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        className={`relative p-4 rounded-full transition-all ${
          isListening
            ? 'bg-destructive text-destructive-foreground animate-pulse'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isListening ? t('voice.recording') : t('voice.tapToSpeak')}
      >
        {isListening ? (
          <>
            <MicOff className="w-6 h-6" />
            {/* Pulse animation rings */}
            <span className="absolute inset-0 rounded-full bg-destructive/30 animate-ping" />
          </>
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </button>

      {/* Status text */}
      <div className="mt-2 text-center min-h-[40px]">
        {isListening && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('voice.listening')}</span>
          </div>
        )}
        {transcript && !isListening && (
          <p className="text-sm text-muted-foreground max-w-xs truncate">
            "{transcript}"
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  )
}

// Compact voice button for inline use
interface VoiceButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function VoiceButton({ onTranscript, disabled = false }: VoiceButtonProps) {
  const { t, language } = useLanguage()
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      setIsSupported(!!SpeechRecognition)
    }
  }, [])

  const getLanguageCode = useCallback(() => {
    switch (language) {
      case 'es': return 'es-ES'
      case 'en': return 'en-US'
      case 'pt': return 'pt-BR'
      default: return 'es-ES'
    }
  }, [language])

  const toggleListening = useCallback(() => {
    if (!isSupported || disabled) return

    if (isListening) {
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = getLanguageCode()

    recognition.onstart = () => setIsListening(true)
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0]
      if (result.isFinal) {
        onTranscript(result[0].transcript)
      }
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    try {
      recognition.start()
    } catch (err) {
      console.error('Failed to start recognition:', err)
    }
  }, [isSupported, disabled, isListening, getLanguageCode, onTranscript])

  if (!isSupported) return null

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={`p-2.5 rounded-lg transition-all ${
        isListening
          ? 'bg-destructive text-destructive-foreground animate-pulse'
          : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isListening ? t('voice.recording') : t('voice.tapToSpeak')}
    >
      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  )
}
