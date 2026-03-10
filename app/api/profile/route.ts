import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Intenta obtener el perfil
    const { data: profile, error: selectError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Si el perfil no existe, crea uno por defecto
    if (selectError && selectError.code === 'PGRST116') {
      const { data: newProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert([{
          id: user.id,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuario',
          currency: 'USD',
          timezone: 'America/New_York',
          language: 'es',
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single()

      if (insertError) {
        return NextResponse.json(
          { error: 'Error al crear el perfil', details: insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json(newProfile)
    }

    if (selectError) {
      return NextResponse.json(
        { error: 'Error al obtener el perfil', details: selectError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(profile)
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

    // Primero intenta actualizar
    const { data: updated, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        display_name,
        currency,
        timezone,
        language,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      // Si falla porque no existe, inserta
      if (updateError.code === 'PGRST116') {
        const { data: inserted, error: insertError } = await supabase
          .from('user_profiles')
          .insert([{
            id: user.id,
            display_name,
            currency,
            timezone,
            language,
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single()

        if (insertError) {
          return NextResponse.json(
            { error: 'Error al guardar el perfil', details: insertError.message },
            { status: 500 }
          )
        }

        return NextResponse.json(inserted)
      }

      return NextResponse.json(
        { error: 'Error al actualizar el perfil', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error en POST profile:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
