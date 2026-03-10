import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Usamos los metadatos del usuario de Supabase Auth para almacenar preferencias
// Esto no requiere crear tablas adicionales

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener preferencias de los metadatos del usuario
    const metadata = user.user_metadata || {}
    
    return NextResponse.json({
      id: user.id,
      display_name: metadata.display_name || user.email?.split('@')[0] || 'Usuario',
      currency: metadata.currency || 'USD',
      timezone: metadata.timezone || 'America/New_York',
      language: metadata.language || 'es',
    })
  } catch (error) {
    console.error('Error en GET profile:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { display_name, currency, timezone, language } = body

    // Actualizar los metadatos del usuario
    const { data, error: updateError } = await supabase.auth.updateUser({
      data: {
        display_name,
        currency,
        timezone,
        language,
      }
    })

    if (updateError) {
      return NextResponse.json(
        { error: 'Error al actualizar el perfil', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: data.user.id,
      display_name: data.user.user_metadata?.display_name || display_name,
      currency: data.user.user_metadata?.currency || currency,
      timezone: data.user.user_metadata?.timezone || timezone,
      language: data.user.user_metadata?.language || language,
    })
  } catch (error) {
    console.error('Error en POST profile:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
